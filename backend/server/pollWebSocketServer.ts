import { WebSocket, WebSocketServer } from 'ws';

export interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  currentActiveStoryId?: string;
}

export interface PollVoteRecord {
  storyId: string;
  stickerId: string;
  optionId: string;
  userId: string;
  votedAt: number;
}

interface PollTallyState {
  totalVotes: number;
  optionCounts: Map<string, number>;
}

// In-memory persistent fallback table: `${storyId}:${stickerId}:${userId}` -> PollVoteRecord
const inMemoryVotes = new Map<string, PollVoteRecord>();

// Pre-aggregated O(1) tallies: `${storyId}:${stickerId}` -> PollTallyState
const pollTallies = new Map<string, PollTallyState>();

// Map storyId -> Set of active WebSocket connections viewing that story
const storyViewers = new Map<string, Set<AuthenticatedSocket>>();

// Maximum payload size to prevent DoS (4KB)
const MAX_WS_PAYLOAD_BYTES = 4096;

export function setupPollWebSocketServer(wss: WebSocketServer, db?: any) {
  wss.on('connection', (ws: AuthenticatedSocket, req) => {
    try {
      const url = new URL(req.url || '', 'http://localhost');
      const userId = url.searchParams.get('userId');
      if (!userId) {
        ws.close(1008, 'UserId required');
        return;
      }
      ws.userId = userId;

      ws.on('message', async (rawMessage) => {
        try {
          if (Buffer.byteLength(rawMessage.toString()) > MAX_WS_PAYLOAD_BYTES) {
            return;
          }

          const message = JSON.parse(rawMessage.toString());
          if (!message || typeof message !== 'object') return;

          switch (message.event) {
            case 'JOIN_STORY_ROOM':
              if (message.data?.storyId && typeof message.data.storyId === 'string') {
                handleJoinStoryRoom(ws, message.data.storyId);
              }
              break;

            case 'LEAVE_STORY_ROOM':
              handleLeaveStoryRoom(ws);
              break;

            case 'POLL_VOTE':
              if (message.data && message.data.storyId && message.data.stickerId && message.data.optionId) {
                await handlePollVote(ws, message.data, db);
              }
              break;
          }
        } catch (err) {
          console.error('[PollWebSocketServer] Error processing poll WS message:', err);
        }
      });

      ws.on('close', () => {
        handleLeaveStoryRoom(ws);
      });
    } catch (connErr) {
      console.error('[PollWebSocketServer] Connection handshake error:', connErr);
      try {
        ws.close(1011, 'Internal server error');
      } catch {}
    }
  });
}

export function handleJoinStoryRoom(ws: AuthenticatedSocket, storyId: string) {
  handleLeaveStoryRoom(ws); // Leave previous room if any
  ws.currentActiveStoryId = storyId;

  let room = storyViewers.get(storyId);
  if (!room) {
    room = new Set<AuthenticatedSocket>();
    storyViewers.set(storyId, room);
  }
  room.add(ws);
}

export function handleLeaveStoryRoom(ws: AuthenticatedSocket) {
  if (ws.currentActiveStoryId) {
    const room = storyViewers.get(ws.currentActiveStoryId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        storyViewers.delete(ws.currentActiveStoryId);
      }
    }
    ws.currentActiveStoryId = undefined;
  }
}

/**
 * Handles incoming poll vote, persists to SQL/In-Memory store, and broadcasts live tally
 * Optimized to O(1) time complexity with pre-aggregated tally caching
 */
export async function handlePollVote(senderWs: AuthenticatedSocket, data: any, db?: any) {
  const { storyId, stickerId, optionId } = data;
  const voterUserId = senderWs.userId!;

  let optionsTally: { id: string; votes: number }[] = [];
  let totalVotes = 0;

  if (db && typeof db.query === 'function') {
    // 1. Record / Upsert vote in PostgreSQL database
    const upsertQuery = `
      INSERT INTO poll_votes (story_id, sticker_id, option_id, user_id, voted_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (story_id, sticker_id, user_id) 
      DO UPDATE SET option_id = EXCLUDED.option_id, voted_at = NOW();
    `;
    await db.query(upsertQuery, [storyId, stickerId, optionId, voterUserId]);

    // 2. Query updated vote counts grouped by option_id
    const aggregateQuery = `
      SELECT option_id, COUNT(*)::int AS votes
      FROM poll_votes
      WHERE story_id = $1 AND sticker_id = $2
      GROUP BY option_id;
    `;
    const result = await db.query(aggregateQuery, [storyId, stickerId]);

    totalVotes = result.rows.reduce((sum: number, row: any) => sum + row.votes, 0);
    optionsTally = result.rows.map((row: any) => ({
      id: row.option_id,
      votes: row.votes,
    }));
  } else {
    // O(1) Fast In-Memory Aggregation
    const voteKey = `${storyId}:${stickerId}:${voterUserId}`;
    const pollKey = `${storyId}:${stickerId}`;

    let tallyState = pollTallies.get(pollKey);
    if (!tallyState) {
      tallyState = { totalVotes: 0, optionCounts: new Map<string, number>() };
      pollTallies.set(pollKey, tallyState);
    }

    const previousVote = inMemoryVotes.get(voteKey);

    if (previousVote) {
      // User changed vote: decrement old option count
      if (previousVote.optionId !== optionId) {
        const oldOptCount = tallyState.optionCounts.get(previousVote.optionId) || 1;
        tallyState.optionCounts.set(previousVote.optionId, Math.max(0, oldOptCount - 1));

        const newOptCount = tallyState.optionCounts.get(optionId) || 0;
        tallyState.optionCounts.set(optionId, newOptCount + 1);
      }
    } else {
      // New vote: increment total count and option count
      tallyState.totalVotes += 1;
      const optCount = tallyState.optionCounts.get(optionId) || 0;
      tallyState.optionCounts.set(optionId, optCount + 1);
    }

    inMemoryVotes.set(voteKey, {
      storyId,
      stickerId,
      optionId,
      userId: voterUserId,
      votedAt: Date.now(),
    });

    totalVotes = tallyState.totalVotes;
    optionsTally = Array.from(tallyState.optionCounts.entries()).map(([id, votes]) => ({
      id,
      votes,
    }));
  }

  // 3. Broadcast updated poll aggregates to EVERY client currently viewing this story room
  const updatePayload = JSON.stringify({
    event: 'POLL_UPDATED',
    data: {
      storyId,
      stickerId,
      totalVotes,
      options: optionsTally,
    },
  });

  const room = storyViewers.get(storyId);
  if (room && room.size > 0) {
    room.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(updatePayload);
      }
    });
  }
}

export default setupPollWebSocketServer;

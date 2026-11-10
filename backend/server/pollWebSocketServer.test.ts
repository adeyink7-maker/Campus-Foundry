import { handleJoinStoryRoom, handleLeaveStoryRoom, handlePollVote, AuthenticatedSocket } from './pollWebSocketServer';
import { WebSocket } from 'ws';

describe('PollWebSocketServer Unit Tests', () => {
  let mockSocket1: Partial<AuthenticatedSocket>;
  let mockSocket2: Partial<AuthenticatedSocket>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSocket1 = {
      userId: 'user_1',
      readyState: WebSocket.OPEN,
      send: jest.fn(),
      close: jest.fn(),
    };

    mockSocket2 = {
      userId: 'user_2',
      readyState: WebSocket.OPEN,
      send: jest.fn(),
      close: jest.fn(),
    };
  });

  it('should join story room and broadcast real-time vote updates to active viewers', async () => {
    const storyId = 'story_100';
    const stickerId = 'poll_200';

    // Both users join story_100
    handleJoinStoryRoom(mockSocket1 as AuthenticatedSocket, storyId);
    handleJoinStoryRoom(mockSocket2 as AuthenticatedSocket, storyId);

    // User 1 votes for option_A
    await handlePollVote(mockSocket1 as AuthenticatedSocket, {
      storyId,
      stickerId,
      optionId: 'opt_A',
    });

    expect(mockSocket1.send).toHaveBeenCalledTimes(1);
    expect(mockSocket2.send).toHaveBeenCalledTimes(1);

    const payload = JSON.parse((mockSocket1.send as jest.Mock).mock.calls[0][0]);
    expect(payload.event).toBe('POLL_UPDATED');
    expect(payload.data.storyId).toBe(storyId);
    expect(payload.data.stickerId).toBe(stickerId);
    expect(payload.data.totalVotes).toBe(1);
    expect(payload.data.options).toEqual(
      expect.arrayContaining([{ id: 'opt_A', votes: 1 }])
    );
  });

  it('should allow user to change their vote and recalculate totals accurately in O(1)', async () => {
    const storyId = 'story_recalc';
    const stickerId = 'poll_recalc';

    handleJoinStoryRoom(mockSocket1 as AuthenticatedSocket, storyId);

    // Initial vote: option_A
    await handlePollVote(mockSocket1 as AuthenticatedSocket, {
      storyId,
      stickerId,
      optionId: 'opt_A',
    });

    // Changed vote: option_B
    await handlePollVote(mockSocket1 as AuthenticatedSocket, {
      storyId,
      stickerId,
      optionId: 'opt_B',
    });

    const lastCall = (mockSocket1.send as jest.Mock).mock.calls[1][0];
    const payload = JSON.parse(lastCall);

    expect(payload.data.totalVotes).toBe(1);
    expect(payload.data.options).toEqual(
      expect.arrayContaining([
        { id: 'opt_A', votes: 0 },
        { id: 'opt_B', votes: 1 },
      ])
    );
  });

  it('should stop sending broadcasts to a client after they leave the story room', async () => {
    const storyId = 'story_leave';
    const stickerId = 'poll_leave';

    handleJoinStoryRoom(mockSocket1 as AuthenticatedSocket, storyId);
    handleJoinStoryRoom(mockSocket2 as AuthenticatedSocket, storyId);

    // Socket 2 leaves room
    handleLeaveStoryRoom(mockSocket2 as AuthenticatedSocket);

    // Socket 1 votes
    await handlePollVote(mockSocket1 as AuthenticatedSocket, {
      storyId,
      stickerId,
      optionId: 'opt_A',
    });

    expect(mockSocket1.send).toHaveBeenCalled();
    expect(mockSocket2.send).not.toHaveBeenCalled();
  });
});

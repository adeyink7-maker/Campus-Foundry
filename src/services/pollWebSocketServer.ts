export function setupPollWebSocketServer(): void {}
export function handleJoinStoryRoom(): void {}
export function handleLeaveStoryRoom(): void {}
export function handlePollVote(): void {}

export type AuthenticatedSocket = any;
export type PollVoteRecord = any;

export default {
  setupPollWebSocketServer,
  handleJoinStoryRoom,
  handleLeaveStoryRoom,
  handlePollVote,
};

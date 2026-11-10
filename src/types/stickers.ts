export type StickerType = 'location' | 'poll' | 'quiz';

export interface BaseSticker {
  id: string;
  type: StickerType;
  x: number; // Normalized X coordinate (0.0 to 1.0)
  y: number; // Normalized Y coordinate (0.0 to 1.0)
  rotation?: number; // Rotation angle in degrees
  scale?: number; // Scale factor
}

export interface LocationSticker extends BaseSticker {
  type: 'location';
  locationName: string;
  latitude: number;
  longitude: number;
}

export interface PollSticker extends BaseSticker {
  type: 'poll';
  question: string;
  options: { id: string; text: string; votes: number }[];
  userVotedOptionId?: string;
}

export interface QuizSticker extends BaseSticker {
  type: 'quiz';
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  userSelectedOptionId?: string;
}

export type StorySticker = LocationSticker | PollSticker | QuizSticker;

export interface PollVotePayload {
  event: 'POLL_VOTE';
  data: {
    storyId: string;
    stickerId: string;
    optionId: string;
    voterUserId: string;
  };
}

export interface PollUpdatedPayload {
  event: 'POLL_UPDATED';
  data: {
    storyId: string;
    stickerId: string;
    totalVotes: number;
    options: {
      id: string;
      votes: number;
    }[];
  };
}


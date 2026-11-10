export type StoryMediaType = 'image' | 'video';

export interface StoryEntity {
  story_id: string;
  author_id: string;
  media_url: string;
  media_type: StoryMediaType;
  duration_seconds: number;
  caption?: string | null;
  created_at: string;
  expires_at: string;
  is_deleted: boolean;
  views_count: number;
  likes_count: number;
  metadata?: Record<string, any>;
}

export interface StoryViewReceipt {
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  device_platform?: string;
}

export interface StoryReaction {
  story_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface AuthorStoryStack {
  author_id: string;
  author_name: string;
  author_avatar?: string;
  has_unseen: boolean;
  latest_created_at: string;
  stories: StoryEntity[];
}

export interface PresignedUploadRequest {
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface PresignedUploadResponse {
  upload_url: string;
  media_url: string;
  key: string;
  expires_in_seconds: number;
}

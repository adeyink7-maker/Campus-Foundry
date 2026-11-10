import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class PendingReply extends Model {
  static table = 'pending_status_replies';

  @field('story_id') storyId!: string;
  @field('story_author_id') storyAuthorId!: string;
  @field('type') type!: 'reply' | 'like';
  @field('content') content?: string;
  @field('client_message_id') clientMessageId!: string;
  @field('sync_status') replySyncStatus!: 'pending' | 'syncing' | 'failed';
  @readonly @date('created_at') createdAt!: Date;
}

export { PendingReply };

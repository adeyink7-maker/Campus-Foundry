import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'pending_status_replies',
      columns: [
        { name: 'story_id', type: 'string' },
        { name: 'story_author_id', type: 'string' },
        { name: 'type', type: 'string' }, // 'reply' | 'like'
        { name: 'content', type: 'string', isOptional: true }, // Text message or reaction emoji
        { name: 'client_message_id', type: 'string' },
        { name: 'sync_status', type: 'string' }, // 'pending' | 'syncing' | 'failed'
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sender_keys',
      columns: [
        { name: 'author_user_id', type: 'string' },
        { name: 'session_id', type: 'string' },
        { name: 'chain_key', type: 'string' },
        { name: 'signature_pub_key', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

export default schema;

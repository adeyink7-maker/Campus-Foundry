import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from './schema';
import { PendingReply } from './PendingReply';

const isWeb = typeof window !== 'undefined' || typeof document !== 'undefined';

let databaseInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (databaseInstance) return databaseInstance;

  const adapter = isWeb
    ? new LokiJSAdapter({
        schema,
        useWebWorker: false,
        useIncrementalIndexedDB: true,
      })
    : new (await import('@nozbe/watermelondb/adapters/sqlite')).default({
        schema,
        jsi: true,
      });

  databaseInstance = new Database({
    adapter,
    modelClasses: [PendingReply],
  });

  return databaseInstance;
}

export class OfflineReplyManager {
  static async enqueueReply(
    storyId: string,
    storyAuthorId: string,
    type: 'reply' | 'like',
    content?: string
  ): Promise<PendingReply> {
    const clientMessageId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const db = await getDatabase();

    return await db.write(async () => {
      return await db.get<PendingReply>('pending_status_replies').create((record) => {
        record.storyId = storyId;
        record.storyAuthorId = storyAuthorId;
        record.type = type;
        record.content = content || '';
        record.clientMessageId = clientMessageId;
        record.replySyncStatus = 'pending';
      });
    });
  }

  static async getPendingQueue(): Promise<PendingReply[]> {
    const db = await getDatabase();
    return await db
      .get<PendingReply>('pending_status_replies')
      .query()
      .fetch();
  }

  static async removeCompleted(id: string): Promise<void> {
    const db = await getDatabase();
    await db.write(async () => {
      const record = await db.get<PendingReply>('pending_status_replies').find(id);
      await record.destroyPermanently();
    });
  }
}

export default OfflineReplyManager;

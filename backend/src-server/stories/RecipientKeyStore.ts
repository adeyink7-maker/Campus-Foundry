import { db } from './config';

export class RecipientKeyStore {
  /**
   * Stores a received Sender Key session from a contact
   */
  static async saveSenderKey(
    authorUserId: string,
    sessionId: string,
    chainKeyHex: string,
    signaturePubKeyHex: string
  ): Promise<void> {
    const query = `
      INSERT INTO sender_keys (author_user_id, session_id, chain_key, signature_pub_key, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (author_user_id) 
      DO UPDATE SET 
        session_id = EXCLUDED.session_id,
        chain_key = EXCLUDED.chain_key,
        signature_pub_key = EXCLUDED.signature_pub_key,
        updated_at = NOW();
    `;
    await db.query(query, [authorUserId, sessionId, chainKeyHex, signaturePubKeyHex]);
  }

  /**
   * Purges keys for a contact if explicit revocation notice is received
   */
  static async revokeSenderKey(authorUserId: string): Promise<void> {
    const query = `DELETE FROM sender_keys WHERE author_user_id = $1;`;
    await db.query(query, [authorUserId]);
  }

  /**
   * Automatic TTL Cleanup: Removes keys older than 24 hours
   */
  static async purgeExpiredKeys(): Promise<void> {
    const query = `DELETE FROM sender_keys WHERE updated_at < NOW() - INTERVAL '24 hours';`;
    await db.query(query, []);
  }
}

export default RecipientKeyStore;

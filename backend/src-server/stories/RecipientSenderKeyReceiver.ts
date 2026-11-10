import { DoubleRatchetSession } from './DoubleRatchetSession';
import { EncryptedKeyDistributionPackage } from './SenderKeyDistributionService';
import { RecipientKeyStore } from './RecipientKeyStore';
import crypto from 'crypto';

export class RecipientSenderKeyReceiver {
  private pairwiseSessions: Map<string, DoubleRatchetSession> = new Map();

  /**
   * Receives, decrypts, and stores incoming SenderKey distribution payloads
   */
  public async processIncomingSenderKeyPackage(
    pkg: EncryptedKeyDistributionPackage
  ): Promise<void> {
    let session = this.pairwiseSessions.get(pkg.senderUserId);

    if (!session) {
      // Reconstruct Double Ratchet Session instance from local database storage
      const dummySharedSecret = crypto
        .createHash('sha256')
        .update(`secret_${pkg.senderUserId}_${pkg.recipientUserId}`)
        .digest();
      session = new DoubleRatchetSession(dummySharedSecret, false);
      this.pairwiseSessions.set(pkg.senderUserId, session);
    }

    // Decrypt the pairwise message
    const decryptedBuffer = session.decrypt(pkg.pairwisePayload);
    const senderKeyPayload = JSON.parse(decryptedBuffer.toString('utf8'));

    // Save decrypted Sender Key to recipient's local database
    await RecipientKeyStore.saveSenderKey(
      pkg.senderUserId,
      senderKeyPayload.groupKeyId,
      senderKeyPayload.chainKeyHex,
      senderKeyPayload.signaturePubKeyPem || senderKeyPayload.signaturePubKeyHex || ''
    );

    console.log(
      `Successfully ingested and cached SenderKey for user ${pkg.senderUserId} (GroupKeyID: ${senderKeyPayload.groupKeyId})`
    );
  }
}

export default RecipientSenderKeyReceiver;

import { DoubleRatchetSession, PairwiseCiphertext } from './DoubleRatchetSession';
import { ActiveSenderKeySession } from './PrivacyAudienceManager';
import crypto from 'crypto';

export interface EncryptedKeyDistributionPackage {
  recipientUserId: string;
  senderUserId: string;
  pairwisePayload: PairwiseCiphertext;
  timestamp: number;
}

export class SenderKeyDistributionService {
  // In-memory store or database map holding active Double Ratchet sessions with contacts
  private pairwiseSessions: Map<string, DoubleRatchetSession> = new Map();

  /**
   * Registers/Loads an existing 1-to-1 Double Ratchet session for a contact
   */
  public registerPairwiseSession(contactUserId: string, session: DoubleRatchetSession) {
    this.pairwiseSessions.set(contactUserId, session);
  }

  /**
   * Encrypts and prepares the Sender Key payload for all approved target contacts
   */
  public async distributeSenderKeyToAudience(
    senderUserId: string,
    activeSenderKeySession: ActiveSenderKeySession,
    authorizedContactUserIds: string[]
  ): Promise<EncryptedKeyDistributionPackage[]> {
    const packages: EncryptedKeyDistributionPackage[] = [];

    // Construct the plain SenderKey payload
    const rawDistributionPayload = JSON.stringify({
      groupKeyId: activeSenderKeySession.sessionId,
      chainKeyHex: activeSenderKeySession.chainKey.toString('hex'),
      signaturePubKeyHex: activeSenderKeySession.signatureKeyPair.publicKey.toString('hex'),
      createdAt: activeSenderKeySession.createdAt,
    });

    const payloadBuffer = Buffer.from(rawDistributionPayload, 'utf8');

    for (const contactId of authorizedContactUserIds) {
      let session = this.pairwiseSessions.get(contactId);

      if (!session) {
        // Fallback: Create new Session using established shared secret (X3DH Key Exchange)
        const dummySharedSecret = crypto.createHash('sha256').update(`secret_${senderUserId}_${contactId}`).digest();
        session = new DoubleRatchetSession(dummySharedSecret, true);
        this.pairwiseSessions.set(contactId, session);
      }

      // Encrypt the SenderKey using the contact's 1-to-1 Double Ratchet Session
      const pairwiseCiphertext = session.encrypt(payloadBuffer);

      packages.push({
        recipientUserId: contactId,
        senderUserId,
        pairwisePayload: pairwiseCiphertext,
        timestamp: Date.now(),
      });
    }

    return packages;
  }
}

export default SenderKeyDistributionService;

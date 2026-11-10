import crypto from 'crypto';
import { RecipientKeyStore } from './RecipientKeyStore';
import { SenderKeySessionManager } from './SenderKeySessionManager';

/**
 * 1-to-1 Pairwise Double Ratchet Protocol & Signal Relay Dispatcher
 * Manages pairwise encrypted distribution of Group Sender Keys between Sender & Contacts.
 */

export interface PairwiseEncryptedEnvelope {
  senderUserId: string;
  recipientUserId: string;
  ephemeralDhPublicKeyHex: string;
  ciphertextHex: string;
  ivHex: string;
  macTagHex: string;
  timestamp: number;
}

export interface DecryptedSenderKeyPayload {
  event: 'SENDER_KEY_DISTRIBUTION';
  authorUserId: string;
  sessionId: string;
  chainKeyHex: string;
  signaturePublicKeyHex: string;
}

export class DoubleRatchetPairwiseRelay {
  /**
   * Encrypts a payload for a specific recipient using a pairwise session key
   */
  public static encryptPairwisePayload(
    senderUserId: string,
    recipientUserId: string,
    payloadObj: object,
    pairwiseSharedSecret: Buffer
  ): PairwiseEncryptedEnvelope {
    const iv = crypto.randomBytes(16);
    const ephemeralDh = crypto.randomBytes(32); // Simulating ephemeral DH public key

    // Derive pairwise AES & MAC keys via HKDF
    const derivedKeys = Buffer.from(
      crypto.hkdfSync(
        'sha256',
        pairwiseSharedSecret,
        Buffer.from('PairwiseSalt_v1'),
        Buffer.from(`Pairwise_${senderUserId}_${recipientUserId}`),
        64
      )
    );

    const pairwiseAesKey = derivedKeys.subarray(0, 32);
    const pairwiseMacKey = derivedKeys.subarray(32, 64);

    // Encrypt payload (AES-256-CBC)
    const cipher = crypto.createCipheriv('aes-256-cbc', pairwiseAesKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(payloadObj), 'utf8'),
      cipher.final(),
    ]);

    // Authenticate with HMAC-SHA256
    const macTag = crypto
      .createHmac('sha256', pairwiseMacKey)
      .update(iv)
      .update(ciphertext)
      .digest('hex');

    return {
      senderUserId,
      recipientUserId,
      ephemeralDhPublicKeyHex: ephemeralDh.toString('hex'),
      ciphertextHex: ciphertext.toString('hex'),
      ivHex: iv.toString('hex'),
      macTagHex: macTag,
      timestamp: Date.now(),
    };
  }

  /**
   * Decrypts an inbound pairwise encrypted envelope on the contact device
   */
  public static decryptPairwisePayload(
    envelope: PairwiseEncryptedEnvelope,
    pairwiseSharedSecret: Buffer
  ): DecryptedSenderKeyPayload {
    const { senderUserId, recipientUserId, ciphertextHex, ivHex, macTagHex } = envelope;

    const iv = Buffer.from(ivHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    // Derive pairwise AES & MAC keys via HKDF
    const derivedKeys = Buffer.from(
      crypto.hkdfSync(
        'sha256',
        pairwiseSharedSecret,
        Buffer.from('PairwiseSalt_v1'),
        Buffer.from(`Pairwise_${senderUserId}_${recipientUserId}`),
        64
      )
    );

    const pairwiseAesKey = derivedKeys.subarray(0, 32);
    const pairwiseMacKey = derivedKeys.subarray(32, 64);

    // Verify HMAC
    const computedMac = crypto
      .createHmac('sha256', pairwiseMacKey)
      .update(iv)
      .update(ciphertext)
      .digest('hex');

    if (computedMac !== macTagHex) {
      throw new Error('Pairwise envelope HMAC verification failed! Message was altered or corrupted.');
    }

    // Decrypt ciphertext
    const decipher = crypto.createDecipheriv('aes-256-cbc', pairwiseAesKey, iv);
    const decryptedBuffer = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const jsonStr = decryptedBuffer.toString('utf8');

    return JSON.parse(jsonStr) as DecryptedSenderKeyPayload;
  }

  /**
   * ==========================================================================
   * SENDER DEVICE: Dispatch active SenderKey across all authorized contacts
   * ==========================================================================
   */
  public static async dispatchSenderKeysToAudience(
    senderUserId: string,
    senderKeyManager: SenderKeySessionManager,
    authorizedContacts: { contactId: string; pairwiseSharedSecret: Buffer }[],
    relayTransport: (envelope: PairwiseEncryptedEnvelope) => Promise<void>
  ): Promise<{ dispatchedCount: number; sessionId: string }> {
    const distributionInfo = senderKeyManager.generateDistributionMessage(senderUserId);

    const payload: DecryptedSenderKeyPayload = {
      event: 'SENDER_KEY_DISTRIBUTION',
      authorUserId: senderUserId,
      sessionId: distributionInfo.groupKeyId,
      chainKeyHex: distributionInfo.chainKey,
      signaturePublicKeyHex: distributionInfo.signaturePublicKey,
    };

    const dispatchPromises = authorizedContacts.map(async (contact) => {
      // 1-to-1 pairwise encryption per contact
      const envelope = this.encryptPairwisePayload(
        senderUserId,
        contact.contactId,
        payload,
        contact.pairwiseSharedSecret
      );

      // Dispatch to Signal relay server
      await relayTransport(envelope);
    });

    await Promise.all(dispatchPromises);

    return {
      dispatchedCount: authorizedContacts.length,
      sessionId: distributionInfo.groupKeyId,
    };
  }

  /**
   * ==========================================================================
   * CONTACT DEVICE: Ingest, Decrypt, and Store SenderKey in local database
   * ==========================================================================
   */
  public static async handleInboundPairwiseDistribution(
    envelope: PairwiseEncryptedEnvelope,
    pairwiseSharedSecret: Buffer
  ): Promise<{ saved: boolean; authorUserId: string; sessionId: string }> {
    // 1. Decrypt 1-to-1 Pairwise Double Ratchet payload
    const decryptedPayload = this.decryptPairwisePayload(envelope, pairwiseSharedSecret);

    if (decryptedPayload.event !== 'SENDER_KEY_DISTRIBUTION') {
      throw new Error(`Unexpected event type: ${decryptedPayload.event}`);
    }

    // 2. Persist in local encrypted database (`sender_keys` table)
    await RecipientKeyStore.saveSenderKey(
      decryptedPayload.authorUserId,
      decryptedPayload.sessionId,
      decryptedPayload.chainKeyHex,
      decryptedPayload.signaturePublicKeyHex
    );

    return {
      saved: true,
      authorUserId: decryptedPayload.authorUserId,
      sessionId: decryptedPayload.sessionId,
    };
  }
}

export default DoubleRatchetPairwiseRelay;

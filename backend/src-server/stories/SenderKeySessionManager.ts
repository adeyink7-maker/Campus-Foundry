import crypto from 'crypto';

export interface SenderKeyDistributionMessage {
  senderUserId: string;
  groupKeyId: string;
  chainKey: string;
  signaturePublicKey: string;
}

export class SenderKeySessionManager {
  private activeChainKey: Buffer;
  private signatureKeyPair: { publicKey: Buffer; privateKey: Buffer };
  private groupKeyId: string;

  constructor() {
    this.groupKeyId = crypto.randomUUID();
    this.activeChainKey = crypto.randomBytes(32);
    // Ed25519 keypair for signing status updates
    const keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'buffer' },
      privateKeyEncoding: { type: 'pkcs8', format: 'buffer' },
    }) as unknown as { publicKey: Buffer; privateKey: Buffer };
    this.signatureKeyPair = keyPair;
  }

  /**
   * Generates a key distribution payload sent over pairwise E2EE to authorized contacts
   */
  public generateDistributionMessage(senderUserId: string): SenderKeyDistributionMessage {
    return {
      senderUserId,
      groupKeyId: this.groupKeyId,
      chainKey: this.activeChainKey.toString('hex'),
      signaturePublicKey: this.signatureKeyPair.publicKey.toString('hex'),
    };
  }

  /**
   * Ratchets the Chain Key forward to create a unique single-use Message Key (Forward Secrecy)
   */
  public getNextMessageKey(): { messageKey: Buffer; signaturePrivateKey: Buffer } {
    // Message Key = HMAC-SHA256(ChainKey, 0x01)
    const messageKey = crypto
      .createHmac('sha256', this.activeChainKey)
      .update(Buffer.from([0x01]))
      .digest();

    // Advance Chain Key = HMAC-SHA256(ChainKey, 0x02)
    this.activeChainKey = crypto
      .createHmac('sha256', this.activeChainKey)
      .update(Buffer.from([0x02]))
      .digest();

    return {
      messageKey,
      signaturePrivateKey: this.signatureKeyPair.privateKey,
    };
  }
}

export default SenderKeySessionManager;

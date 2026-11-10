import crypto from 'crypto';

export interface PairwiseCiphertext {
  ephemeralPublicKeyHex: string;
  sequenceNumber: number;
  ciphertextHex: string;
  authTagHex: string;
}

export class DoubleRatchetSession {
  private rootKey: Buffer;
  private sendingChainKey: Buffer | null = null;
  private receivingChainKey: Buffer | null = null;
  private dhSendingKeyPair: { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject };
  private sendSequenceNumber = 0;

  constructor(sharedMasterSecret: Buffer, isInitiator: boolean) {
    this.rootKey = sharedMasterSecret;
    this.dhSendingKeyPair = crypto.generateKeyPairSync('x25519');

    if (isInitiator) {
      // Initiator derives initial sending chain key from root key
      const derived = this.kdfRoot(this.rootKey, crypto.randomBytes(32));
      this.rootKey = derived.nextRootKey;
      this.sendingChainKey = derived.chainKey;
    }
  }

  /**
   * KDF for Root Key Ratcheting (HMAC-SHA256)
   */
  private kdfRoot(rootKey: Buffer, dhSecret: Buffer): { nextRootKey: Buffer; chainKey: Buffer } {
    const prk = crypto.createHmac('sha256', rootKey).update(dhSecret).digest();
    const nextRootKey = crypto.createHmac('sha256', prk).update(Buffer.from('RootRatchet')).digest();
    const chainKey = crypto.createHmac('sha256', prk).update(Buffer.from('ChainRatchet')).digest();
    return { nextRootKey, chainKey };
  }

  /**
   * KDF for Message Key Ratcheting
   */
  private kdfChain(chainKey: Buffer): { nextChainKey: Buffer; messageKey: Buffer } {
    const messageKey = crypto.createHmac('sha256', chainKey).update(Buffer.from([0x01])).digest();
    const nextChainKey = crypto.createHmac('sha256', chainKey).update(Buffer.from([0x02])).digest();
    return { nextChainKey, messageKey };
  }

  /**
   * Encrypts a payload for a recipient over the 1-to-1 session
   */
  public encrypt(plaintext: Buffer): PairwiseCiphertext {
    if (!this.sendingChainKey) {
      throw new Error('Sending chain key not initialized.');
    }

    // Step 1: Ratchet sending chain key forward to derive a unique Message Key
    const { nextChainKey, messageKey } = this.kdfChain(this.sendingChainKey);
    this.sendingChainKey = nextChainKey;

    // Step 2: Encrypt with AES-256-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', messageKey, iv);
    
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const exportedPubKey = this.dhSendingKeyPair.publicKey.export({ type: 'spki', format: 'der' });

    const result: PairwiseCiphertext = {
      ephemeralPublicKeyHex: Buffer.from(exportedPubKey).toString('hex'),
      sequenceNumber: this.sendSequenceNumber++,
      ciphertextHex: Buffer.concat([iv, ciphertext]).toString('hex'),
      authTagHex: authTag.toString('hex'),
    };

    return result;
  }

  /**
   * Decrypts a 1-to-1 payload received from a contact
   */
  public decrypt(pairwiseData: PairwiseCiphertext): Buffer {
    if (!this.receivingChainKey) {
      // Derive initial receiving key if receiving for first time
      const derived = this.kdfRoot(this.rootKey, Buffer.from(pairwiseData.ephemeralPublicKeyHex, 'hex'));
      this.rootKey = derived.nextRootKey;
      this.receivingChainKey = derived.chainKey;
    }

    const { nextChainKey, messageKey } = this.kdfChain(this.receivingChainKey);
    this.receivingChainKey = nextChainKey;

    const payloadBuffer = Buffer.from(pairwiseData.ciphertextHex, 'hex');
    const iv = payloadBuffer.subarray(0, 12);
    const ciphertext = payloadBuffer.subarray(12);
    const authTag = Buffer.from(pairwiseData.authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', messageKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
}

export default DoubleRatchetSession;

import { MediaCryptoService } from './MediaCryptoService';
import { SenderKeySessionManager } from './SenderKeySessionManager';
import crypto from 'crypto';

export interface EncryptedStoryPayload {
  senderUserId: string;
  groupKeyId: string;
  encryptedMetadataCiphertext: string; // AES-256 encrypted json
  iv: string;
  signature: string;
}

export class EncryptedStoryPublisher {
  private senderKeyManager: SenderKeySessionManager;

  constructor() {
    this.senderKeyManager = new SenderKeySessionManager();
  }

  /**
   * Encrypts and prepares a complete E2EE story update
   */
  public async prepareE2EEStory(
    senderUserId: string,
    rawMediaFilePath: string,
    authorizedContactIds: string[],
    caption?: string
  ): Promise<{ payload: EncryptedStoryPayload; distributionList: string[] }> {
    // Step 1: Encrypt raw image/video file locally
    const encResult = await MediaCryptoService.encryptFile(rawMediaFilePath);

    // Step 2: Upload encResult.encryptedFilePath to S3 (Simulated S3 Key)
    const s3MediaBlobUrl = `https://s3.amazonaws.com/bucket/stories/${crypto.randomUUID()}.enc`;

    // Step 3: Construct status metadata JSON
    const statusMetadata = {
      mediaUrl: s3MediaBlobUrl,
      mediaKey: encResult.mediaKey,
      macKey: encResult.macKey,
      macTag: encResult.macTag,
      mediaIv: encResult.iv,
      caption: caption || '',
      timestamp: Date.now(),
    };

    // Step 4: Get single-use Message Key from Sender Key Session
    const { messageKey, signaturePrivateKey } = this.senderKeyManager.getNextMessageKey();
    const metadataIv = crypto.randomBytes(16);

    // Encrypt metadata payload with Message Key
    const cipher = crypto.createCipheriv('aes-256-cbc', messageKey, metadataIv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(statusMetadata), 'utf8'),
      cipher.final(),
    ]);

    // Sign metadata ciphertext with Ed25519 key
    const privateKeyObject = crypto.createPrivateKey({
      key: signaturePrivateKey,
      format: 'der',
      type: 'pkcs8',
    });
    const signature = crypto.sign(null, ciphertext, privateKeyObject);

    const payload: EncryptedStoryPayload = {
      senderUserId,
      groupKeyId: this.senderKeyManager.generateDistributionMessage(senderUserId).groupKeyId,
      encryptedMetadataCiphertext: ciphertext.toString('hex'),
      iv: metadataIv.toString('hex'),
      signature: signature.toString('hex'),
    };

    return {
      payload,
      distributionList: authorizedContactIds,
    };
  }
}

export default EncryptedStoryPublisher;

import crypto from 'crypto';
import fs from 'fs';

export interface EncryptedMediaOutput {
  encryptedFilePath: string;
  mediaKey: string;      // Hex-encoded 32-byte AES key
  macKey: string;        // Hex-encoded 32-byte HMAC key
  macTag: string;        // Hex-encoded authentication tag
  iv: string;            // Hex-encoded 16-byte initialization vector
}

export class MediaCryptoService {
  /**
   * Encrypts a raw media file locally before uploading to S3
   */
  static async encryptFile(inputFilePath: string): Promise<EncryptedMediaOutput> {
    const mediaKey = crypto.randomBytes(32);
    const macKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const encryptedFilePath = `${inputFilePath}.enc`;
    const cipher = crypto.createCipheriv('aes-256-cbc', mediaKey, iv);
    const hmac = crypto.createHmac('sha256', macKey);

    const inputStream = fs.createReadStream(inputFilePath);
    const outputStream = fs.createWriteStream(encryptedFilePath);

    // Include IV in the HMAC tag generation
    hmac.update(iv);

    return new Promise((resolve, reject) => {
      inputStream.on('data', (chunk) => {
        const encryptedChunk = cipher.update(chunk);
        hmac.update(encryptedChunk);
        outputStream.write(encryptedChunk);
      });

      inputStream.on('end', () => {
        const finalChunk = cipher.final();
        hmac.update(finalChunk);
        outputStream.write(finalChunk);
        outputStream.end();

        const macTag = hmac.digest('hex');

        resolve({
          encryptedFilePath,
          mediaKey: mediaKey.toString('hex'),
          macKey: macKey.toString('hex'),
          macTag,
          iv: iv.toString('hex'),
        });
      });

      inputStream.on('error', reject);
      outputStream.on('error', reject);
    });
  }

  /**
   * Decrypts an encrypted blob downloaded from S3 using the extracted keys
   */
  static async decryptFile(
    encryptedFilePath: string,
    outputFilePath: string,
    mediaKeyHex: string,
    macKeyHex: string,
    ivHex: string,
    expectedMacTag: string
  ): Promise<boolean> {
    const mediaKey = Buffer.from(mediaKeyHex, 'hex');
    const macKey = Buffer.from(macKeyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');

    // 1. Verify HMAC Tag first (Encrypt-Then-MAC verification)
    const hmac = crypto.createHmac('sha256', macKey);
    hmac.update(iv);

    const fileBuffer = fs.readFileSync(encryptedFilePath);
    hmac.update(fileBuffer);
    const calculatedMacTag = hmac.digest('hex');

    if (calculatedMacTag !== expectedMacTag) {
      throw new Error('HMAC verification failed! The encrypted media has been tampered with.');
    }

    // 2. Decrypt media payload
    const decipher = crypto.createDecipheriv('aes-256-cbc', mediaKey, iv);
    const decryptedBuffer = Buffer.concat([decipher.update(fileBuffer), decipher.final()]);

    fs.writeFileSync(outputFilePath, decryptedBuffer);
    return true;
  }
}

export default MediaCryptoService;

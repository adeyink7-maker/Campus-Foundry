import crypto from 'crypto';

export interface ContactPrivacySettings {
  mode: 'ALL_CONTACTS' | 'EXCEPT' | 'ONLY_SHARE_WITH';
  excludedUserIds: Set<string>;
  allowedUserIds: Set<string>;
}

export interface ActiveSenderKeySession {
  sessionId: string;
  chainKey: Buffer;
  signatureKeyPair: { publicKey: Buffer; privateKey: Buffer };
  allowedAudienceUserIds: Set<string>;
  createdAt: number;
}

export class PrivacyAudienceManager {
  private activeSession: ActiveSenderKeySession | null = null;
  private currentSettings: ContactPrivacySettings;

  constructor(initialSettings: ContactPrivacySettings) {
    this.currentSettings = initialSettings;
    this.createNewSenderKeySession(this.computeEffectiveAudience());
  }

  /**
   * Computes the list of user IDs eligible to receive status updates based on privacy mode
   */
  public computeEffectiveAudience(allContactsList: string[] = []): Set<string> {
    const effectiveSet = new Set<string>();

    switch (this.currentSettings.mode) {
      case 'ALL_CONTACTS':
        allContactsList.forEach((id) => effectiveSet.add(id));
        break;
      case 'EXCEPT':
        allContactsList.forEach((id) => {
          if (!this.currentSettings.excludedUserIds.has(id)) {
            effectiveSet.add(id);
          }
        });
        break;
      case 'ONLY_SHARE_WITH':
        this.currentSettings.allowedUserIds.forEach((id) => effectiveSet.add(id));
        break;
    }

    return effectiveSet;
  }

  /**
   * Destroys current keys securely in memory and instantiates a new SenderKey session
   */
  private createNewSenderKeySession(newAudience: Set<string>): ActiveSenderKeySession {
    // 1. Securely zero out existing key buffer if one exists
    if (this.activeSession) {
      this.activeSession.chainKey.fill(0); // Zero-fill memory buffer
      this.activeSession = null;
    }

    // 2. Generate a fresh key session
    const keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'buffer' },
      privateKeyEncoding: { type: 'pkcs8', format: 'buffer' },
    }) as unknown as { publicKey: Buffer; privateKey: Buffer };

    const newSession: ActiveSenderKeySession = {
      sessionId: crypto.randomUUID(),
      chainKey: crypto.randomBytes(32),
      signatureKeyPair: keyPair,
      allowedAudienceUserIds: newAudience,
      createdAt: Date.now(),
    };

    this.activeSession = newSession;
    return newSession;
  }

  /**
   * Updates privacy audience settings. Triggers key revocation if audience changes.
   */
  public updatePrivacySettings(
    newSettings: ContactPrivacySettings,
    allContactsList: string[]
  ): { sessionChanged: boolean; newSession: ActiveSenderKeySession; newDistributionList: string[] } {
    this.currentSettings = newSettings;
    const updatedAudience = this.computeEffectiveAudience(allContactsList);

    // Check if the audience actually changed
    const audienceChanged =
      !this.activeSession ||
      updatedAudience.size !== this.activeSession.allowedAudienceUserIds.size ||
      Array.from(updatedAudience).some((id) => !this.activeSession!.allowedAudienceUserIds.has(id));

    if (audienceChanged) {
      console.log('Audience privacy settings modified. Revoking old keys and ratcheting session...');
      const freshSession = this.createNewSenderKeySession(updatedAudience);

      return {
        sessionChanged: true,
        newSession: freshSession,
        newDistributionList: Array.from(updatedAudience),
      };
    }

    return {
      sessionChanged: false,
      newSession: this.activeSession!,
      newDistributionList: Array.from(this.activeSession!.allowedAudienceUserIds),
    };
  }

  public getActiveSession(): ActiveSenderKeySession {
    if (!this.activeSession) {
      throw new Error('No active SenderKey session initialized!');
    }
    return this.activeSession;
  }
}

export default PrivacyAudienceManager;

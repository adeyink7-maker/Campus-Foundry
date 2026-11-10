import { PrivacyAudienceManager, ContactPrivacySettings } from './PrivacyAudienceManager';

export interface PairwiseMessagingService {
  sendPairwiseE2EEMessage(
    recipientUserId: string,
    payload: { event: string; sessionId: string; chainKeyHex: string; signaturePubKeyHex: string }
  ): Promise<void>;
}

export class StatusPrivacyOrchestrator {
  private audienceManager: PrivacyAudienceManager;
  private pairwiseMessaging: PairwiseMessagingService;

  constructor(
    initialSettings: ContactPrivacySettings,
    pairwiseMessaging: PairwiseMessagingService
  ) {
    this.audienceManager = new PrivacyAudienceManager(initialSettings);
    this.pairwiseMessaging = pairwiseMessaging;
  }

  /**
   * Called when user modifies their Status Privacy settings in app UI
   */
  public async handlePrivacySettingsChange(
    newSettings: ContactPrivacySettings,
    allContactsList: string[]
  ): Promise<void> {
    const result = this.audienceManager.updatePrivacySettings(newSettings, allContactsList);

    if (result.sessionChanged) {
      const session = result.newSession;

      // Distribute fresh Sender Key ONLY to approved audience members over 1-to-1 pairwise channels
      const distributionPromises = result.newDistributionList.map((recipientId) =>
        this.pairwiseMessaging.sendPairwiseE2EEMessage(recipientId, {
          event: 'SENDER_KEY_DISTRIBUTION',
          sessionId: session.sessionId,
          chainKeyHex: session.chainKey.toString('hex'),
          signaturePubKeyHex: session.signatureKeyPair.publicKey.toString('hex'),
        })
      );

      await Promise.all(distributionPromises);
      console.log(`Successfully distributed new Sender Key (Session: ${session.sessionId}) to ${result.newDistributionList.length} contacts.`);
    }
  }

  /**
   * Prepares story payload for dispatch
   */
  public getActiveAudienceAndSession() {
    const session = this.audienceManager.getActiveSession();
    return {
      sessionId: session.sessionId,
      allowedUserIds: Array.from(session.allowedAudienceUserIds),
    };
  }
}

export default StatusPrivacyOrchestrator;

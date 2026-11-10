export interface DecryptStreamSession {
  sessionId: string;
  url: string;
}

export class LocalVideoDecryptServer {
  public static async startSession(url: string): Promise<DecryptStreamSession> {
    return { sessionId: 'web', url };
  }
}
export default LocalVideoDecryptServer;

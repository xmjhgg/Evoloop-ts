export interface Identity {
  readonly origin: string;
  readonly accountId: string;
  readonly username: string;
  readonly credential: string;
  readonly expiresAt: string;
  readonly healthAllowed: boolean;
  readonly aiAllowed: boolean;
  readonly purposeVersion: string;
}

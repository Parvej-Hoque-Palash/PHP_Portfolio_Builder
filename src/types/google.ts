export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthSession {
  accessToken: string;
  /** Epoch milliseconds when the access token expires. */
  expiresAt: number;
  user: GoogleUser;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
}

export interface UploadedFile extends DriveFile {
  /** Direct URL usable in <img src> / PDF viewers once the file is public. */
  publicUrl: string;
}

/**
 * Shape of portfolio_config.json. Extend this as you move page content into Drive.
 * Unknown keys are preserved on read/write.
 */
export interface PortfolioConfig {
  version: number;
  updatedAt?: string;
  [key: string]: unknown;
}

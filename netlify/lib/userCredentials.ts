import { getStore } from '@netlify/blobs';

/** A user's own Google credentials, used for their sign-in and their public portfolio. */
export interface UserCredentials {
  email: string;
  googleClientId: string;
  googleApiKey: string;
  updatedAt: string;
}

/**
 * `verified` is in use. `pending` was submitted at /account and waits for the user
 * to sign in through its Client ID (proving both the email and the Client ID).
 */
export interface UserCredentialsRecord {
  verified: UserCredentials | null;
  pending: UserCredentials | null;
}

const store = () => getStore({ name: 'user-credentials', consistency: 'strong' });

export async function readUserCredentials(username: string): Promise<UserCredentialsRecord> {
  const record = (await store().get(username, { type: 'json' })) as Partial<UserCredentialsRecord> | null;
  return { verified: record?.verified ?? null, pending: record?.pending ?? null };
}

export async function writeUserCredentials(username: string, record: UserCredentialsRecord): Promise<void> {
  if (!record.verified && !record.pending) await store().delete(username);
  else await store().setJSON(username, record);
}

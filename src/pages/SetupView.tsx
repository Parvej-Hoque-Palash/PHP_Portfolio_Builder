import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ExternalLink, KeyRound, Loader2, LogIn, LogOut, Pencil, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { googleConfig, isGoogleConfigured } from '../config/googleConfig';
import { SITE_CONFIG_API, prefersCurrentSettings, startupSetup, type SiteSettings, type SiteSetup } from '../config/runtimeConfig';

type Draft = Pick<SiteSettings, 'ownerEmail' | 'googleClientId' | 'googleApiKey'>;

const maskKey = (key: string) => (key.length > 10 ? `${key.slice(0, 6)}…${key.slice(-4)}` : '••••');

async function postSetup(body: object, accessToken?: string | null): Promise<SiteSetup> {
  const res = await fetch(SITE_CONFIG_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (SiteSetup & { error?: string }) | null;
  if (!res.ok || !data) throw new Error(data?.error ?? `Could not save settings (${res.status}).`);
  return data;
}

/** Full reload so the new settings are applied before the app starts. */
const reloadTo = (path: string) => window.location.assign(path);

const Card = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="dash-card space-y-5">
    {children}
  </motion.div>
);

const SettingsSummary = ({ settings }: { settings: SiteSettings }) => (
  <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 rounded-lg bg-gray-50 px-4 py-3 text-sm">
    <dt className="text-gray-500">Owner</dt>
    <dd className="truncate font-medium text-gray-800">{settings.ownerEmail}</dd>
    <dt className="text-gray-500">Client ID</dt>
    <dd className="truncate font-mono text-gray-800">{settings.googleClientId}</dd>
    <dt className="text-gray-500">API key</dt>
    <dd className="font-mono text-gray-800">{maskKey(settings.googleApiKey)}</dd>
  </dl>
);

interface SettingsFormProps {
  initial: Draft;
  lockEmail: boolean;
  submitLabel: string;
  onSubmit: (draft: Draft) => Promise<void>;
  onCancel?: () => void;
}

const SettingsForm = ({ initial, lockEmail, submitLabel, onSubmit, onCancel }: SettingsFormProps) => {
  const [draft, setDraft] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const origin = window.location.origin;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        ownerEmail: draft.ownerEmail.trim().toLowerCase(),
        googleClientId: draft.googleClientId.trim(),
        googleApiKey: draft.googleApiKey.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.');
      setIsSaving(false);
    }
  };

  const field = (key: keyof Draft) => ({
    value: draft[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [key]: e.target.value })),
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="ownerEmail" className="dash-label">Your Gmail address (site owner)</label>
        <input id="ownerEmail" type="email" required className="dash-input" placeholder="you@gmail.com" readOnly={lockEmail} {...field('ownerEmail')} />
        <p className="mt-1 text-xs text-gray-500">Your portfolio is shown at the site's home page. Other users get their own pages.</p>
      </div>
      <div>
        <label htmlFor="googleClientId" className="dash-label">Google OAuth Client ID</label>
        <input id="googleClientId" required className="dash-input font-mono" placeholder="1234…apps.googleusercontent.com" {...field('googleClientId')} />
        <p className="mt-1 text-xs text-gray-500">
          Credentials → Create credentials → OAuth client ID → Web application. Add <code>{origin}</code> under{' '}
          <strong>Authorized JavaScript origins</strong>.
        </p>
      </div>
      <div>
        <label htmlFor="googleApiKey" className="dash-label">Google API key</label>
        <input id="googleApiKey" required className="dash-input font-mono" placeholder="AIza…" {...field('googleApiKey')} />
        <p className="mt-1 text-xs text-gray-500">
          Credentials → Create credentials → API key. Restrict it to the <strong>Google Drive API</strong> and the website{' '}
          <code>{origin}/*</code>. Enable the Drive API for the project too.
        </p>
      </div>
      <a
        href="https://console.cloud.google.com/apis/credentials"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800"
      >
        Open Google Cloud Console <ExternalLink size={14} />
      </a>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
          {isSaving ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

/**
 * One-time site setup at /setup: the deployer enters their Gmail, Google Client ID
 * and API key, then confirms by signing in with that Client ID. Saved in Netlify
 * Blobs; no code or Netlify configuration needed.
 */
const SetupView = () => {
  const { user, accessToken, isAuthenticated, isLoading, error: authError, login, logout } = useAuth();
  const setup = startupSetup();
  const [isEditing, setIsEditing] = useState(false);
  const [wantsVerify, setWantsVerify] = useState(false);
  const [verifyState, setVerifyState] = useState<{ status: 'idle' | 'working' | 'done' } | { status: 'error'; message: string }>({
    status: 'idle',
  });

  const pending = setup?.pending && !prefersCurrentSettings() ? setup.pending : null;
  const verified = setup?.verified ?? null;

  const verify = useCallback(async () => {
    setWantsVerify(false);
    setVerifyState({ status: 'working' });
    try {
      await postSetup({ action: 'verify' }, accessToken);
      setVerifyState({ status: 'done' });
    } catch (err) {
      setVerifyState({ status: 'error', message: err instanceof Error ? err.message : 'Could not confirm the settings.' });
    }
  }, [accessToken]);

  // Confirm as soon as the sign-in started from this page completes.
  useEffect(() => {
    if (wantsVerify && isAuthenticated && accessToken) verify();
  }, [wantsVerify, isAuthenticated, accessToken, verify]);

  const confirm = () => {
    if (isAuthenticated) verify();
    else {
      setWantsVerify(true);
      login();
    }
  };

  const submit = async (draft: Draft) => {
    await postSetup({ action: 'submit', ...draft }, verified || pending ? accessToken : null);
    reloadTo('/setup'); // start again with the new Client ID, ready to confirm
  };

  const isOwner = Boolean(verified && user && user.email.toLowerCase() === verified.ownerEmail);
  const empty: Draft = { ownerEmail: '', googleClientId: '', googleApiKey: '' };

  let content;
  if (setup === null) {
    // No site-config function: local `vite` or a non-Netlify host.
    content = (
      <Card>
        <h2 className="text-xl font-semibold text-gray-800">Setup isn't available here</h2>
        <p className="text-gray-600">
          The setup form saves settings through a Netlify Function, so it only works on the deployed Netlify site. Here, the
          site uses <code>src/config/siteConfig.ts</code> or <code>.env.local</code>.
        </p>
        <p className="text-sm text-gray-500">
          Current status: Google sign-in is {isGoogleConfigured() ? 'configured' : 'not configured'}; API key is{' '}
          {googleConfig.apiKey ? 'set' : 'missing'}.
        </p>
      </Card>
    );
  } else if (verifyState.status === 'done') {
    content = (
      <Card>
        <div className="flex items-center gap-3 text-green-700">
          <CheckCircle2 size={28} />
          <h2 className="text-xl font-semibold">Setup complete</h2>
        </div>
        <p className="text-gray-600">Your site now uses these settings. Anyone with a Gmail account can sign in and build a portfolio.</p>
        <button type="button" className="btn-primary" onClick={() => reloadTo('/dashboard')}>
          Open my dashboard
        </button>
      </Card>
    );
  } else if (pending && !isEditing) {
    content = (
      <Card>
        <h2 className="text-xl font-semibold text-gray-800">Step 2 of 2: confirm with Google</h2>
        <p className="text-gray-600">
          Sign in as <strong>{pending.ownerEmail}</strong>. This checks that the Client ID works and that you own the email.
          The settings take effect only after this.
        </p>
        <SettingsSummary settings={pending} />
        {verifyState.status === 'error' && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="flex-1 min-w-0">{verifyState.message}</span>
            {isAuthenticated && (
              <button type="button" className="btn-secondary" onClick={logout}>
                <LogOut size={14} /> Sign out
              </button>
            )}
          </div>
        )}
        {authError && <p className="text-sm text-red-600">{authError}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={confirm} disabled={isLoading || verifyState.status === 'working'}>
            {isLoading || verifyState.status === 'working' ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {isAuthenticated ? `Confirm as ${user?.email}` : 'Sign in with Google to confirm'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setIsEditing(true)}>
            <Pencil size={16} /> Edit settings
          </button>
        </div>
        <p className="text-xs text-gray-500">
          A Google error like <em>origin_mismatch</em> or <em>invalid_client</em> means the Client ID is wrong or{' '}
          <code>{window.location.origin}</code> isn't an authorized JavaScript origin.
          {verified && (
            <>
              {' '}
              To keep the current settings instead, <a href="/setup?current" className="underline">sign in with the current settings</a>.
            </>
          )}
        </p>
      </Card>
    );
  } else if (pending && isEditing) {
    content = (
      <Card>
        <h2 className="text-xl font-semibold text-gray-800">Edit settings</h2>
        <SettingsForm
          initial={pending}
          lockEmail={Boolean(verified)}
          submitLabel="Save and continue"
          onSubmit={submit}
          onCancel={() => setIsEditing(false)}
        />
      </Card>
    );
  } else if (verified) {
    content = (
      <Card>
        <div className="flex items-center gap-3 text-green-700">
          <CheckCircle2 size={24} />
          <h2 className="text-xl font-semibold">This site is set up</h2>
        </div>
        <SettingsSummary settings={verified} />
        {isEditing && isOwner ? (
          <SettingsForm initial={verified} lockEmail submitLabel="Save and continue" onSubmit={submit} onCancel={() => setIsEditing(false)} />
        ) : isOwner ? (
          <button type="button" className="btn-secondary" onClick={() => setIsEditing(true)}>
            <Pencil size={16} /> Change settings
          </button>
        ) : (
          <div className="space-y-3 text-sm text-gray-600">
            <p>Only the site owner can change these settings.</p>
            {!isAuthenticated ? (
              <button type="button" className="btn-secondary" onClick={login} disabled={isLoading}>
                <LogIn size={16} /> Sign in as owner
              </button>
            ) : (
              <p>
                Signed in as {user?.email}.{' '}
                <button type="button" className="underline" onClick={logout}>
                  Sign out
                </button>
              </p>
            )}
            <Link to="/dashboard" className="inline-block font-medium text-purple-600 hover:text-purple-800">
              Go to the dashboard →
            </Link>
          </div>
        )}
      </Card>
    );
  } else {
    content = (
      <Card>
        <h2 className="text-xl font-semibold text-gray-800">Step 1 of 2: connect Google</h2>
        <p className="text-gray-600">
          Enter your Google Cloud credentials once. After that, anyone can sign in with Gmail and build their own portfolio. Your
          users never need to do this.
        </p>
        <SettingsForm initial={empty} lockEmail={false} submitLabel="Save and continue" onSubmit={submit} />
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-50 p-3">
            <Settings size={24} className="text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Site setup</h1>
        </div>
        {content}
      </div>
    </div>
  );
};

export default SetupView;

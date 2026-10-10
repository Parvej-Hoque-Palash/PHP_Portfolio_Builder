import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, ExternalLink, KeyRound, Loader2, LogIn, Pencil, Trash2, UserCog } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import SignInHelp, { PublishAppSteps } from '../components/SignInHelp';
import {
  fetchUserCredentials,
  removeUserCredentials,
  submitUserCredentials,
  userCredentialsAvailable,
  verifyUserCredentials,
  type UserCredentials,
  type UserCredentialsState,
} from '../services/userCredentials';
import { isGmail, usernameFromEmail } from '../utils/username';

const maskKey = (key: string) => (key.length > 10 ? `${key.slice(0, 6)}…${key.slice(-4)}` : '••••');
const message = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

const Card = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="dash-card space-y-5">
    {children}
  </motion.div>
);

const Summary = ({ creds }: { creds: UserCredentials }) => (
  <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 rounded-lg bg-gray-50 px-4 py-3 text-sm">
    <dt className="text-gray-500">Gmail</dt>
    <dd className="truncate font-medium text-gray-800">{creds.email}</dd>
    <dt className="text-gray-500">Client ID</dt>
    <dd className="truncate font-mono text-gray-800">{creds.googleClientId}</dd>
    <dt className="text-gray-500">API key</dt>
    <dd className="font-mono text-gray-800">{maskKey(creds.googleApiKey)}</dd>
  </dl>
);

interface CredentialsFormProps {
  email: string;
  initial?: UserCredentials | null;
  onSubmit: (values: { googleClientId: string; googleApiKey: string }) => Promise<void>;
  onCancel?: () => void;
}

const CredentialsForm = ({ email, initial, onSubmit, onCancel }: CredentialsFormProps) => {
  const [clientId, setClientId] = useState(initial?.googleClientId ?? '');
  const [apiKey, setApiKey] = useState(initial?.googleApiKey ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const origin = window.location.origin;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({ googleClientId: clientId.trim(), googleApiKey: apiKey.trim() });
    } catch (err) {
      setError(message(err, 'Could not save your credentials.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-gray-600">
        For <strong>{email}</strong>. Your portfolio will be at <code>{origin}/{usernameFromEmail(email)}</code>.
      </p>
      <div>
        <label htmlFor="userClientId" className="dash-label">Google OAuth Client ID</label>
        <input id="userClientId" required className="dash-input font-mono" placeholder="1234…apps.googleusercontent.com" value={clientId} onChange={(e) => setClientId(e.target.value)} />
        <p className="mt-1 text-xs text-gray-500">
          Credentials → Create credentials → OAuth client ID → Web application. Add <code>{origin}</code> under{' '}
          <strong>Authorized JavaScript origins</strong>.
        </p>
      </div>
      <div>
        <label htmlFor="userApiKey" className="dash-label">Google API key</label>
        <input id="userApiKey" required className="dash-input font-mono" placeholder="AIza…" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        <p className="mt-1 text-xs text-gray-500">
          Credentials → Create credentials → API key. Restrict it to the <strong>Google Drive API</strong> and the website{' '}
          <code>{origin}/*</code>. Enable the Drive API for the project too. Visitors use this key to load your portfolio.
        </p>
      </div>
      <div className="rounded-lg bg-purple-50 px-4 py-3 text-sm text-purple-900 ring-1 ring-purple-100">
        <p className="mb-1.5 font-semibold">Then publish your Google app</p>
        <p className="mb-2">
          New Google projects start in <strong>Testing</strong> mode, which blocks sign-in with <em>"Error 403: access_denied"</em>.
        </p>
        <PublishAppSteps />
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
          {isSaving ? 'Saving…' : 'Save and continue'}
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
 * /account: a user registers their own Google Client ID and API key, then confirms
 * them by signing in through that Client ID. Afterwards their sign-in uses their
 * own Google app and visitors load their portfolio with their own key.
 */
const AccountView = () => {
  const [searchParams] = useSearchParams();
  const { user, accessToken, clientId: sessionClientId, isAuthenticated, isLoading, error: authError, issue, login, logout } = useAuth();
  const [emailInput, setEmailInput] = useState(searchParams.get('email') ?? '');
  const [email, setEmail] = useState<string | null>(null);
  const [state, setState] = useState<UserCredentialsState | null | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [wantsVerify, setWantsVerify] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const choose = useCallback(async (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!isGmail(normalized)) {
      setActionError('Enter a Gmail address (…@gmail.com).');
      return;
    }
    setActionError(null);
    setEmail(normalized);
    setState(undefined);
    setState(await fetchUserCredentials(usernameFromEmail(normalized), { fresh: true }));
  }, []);

  // ?email=… (from the sign-in page) skips the first step.
  useEffect(() => {
    const fromLink = searchParams.get('email');
    if (fromLink && isGmail(fromLink)) choose(fromLink);
  }, [searchParams, choose]);

  const signedInAsThisUser = Boolean(email && user && user.email.toLowerCase() === email);

  const verify = useCallback(async () => {
    if (!accessToken) return;
    setWantsVerify(false);
    setBusy(true);
    setActionError(null);
    try {
      setState(await verifyUserCredentials(accessToken));
      setVerified(true);
    } catch (err) {
      setActionError(message(err, 'Could not confirm your credentials.'));
    } finally {
      setBusy(false);
    }
  }, [accessToken]);

  // Confirm as soon as the sign-in started from this page completes.
  useEffect(() => {
    if (wantsVerify && isAuthenticated && accessToken) verify();
  }, [wantsVerify, isAuthenticated, accessToken, verify]);

  const confirmPending = (pending: UserCredentials) => {
    if (signedInAsThisUser && sessionClientId === pending.googleClientId) return void verify();
    setWantsVerify(true);
    login({ clientId: pending.googleClientId, email: pending.email });
  };

  const save = async (values: { googleClientId: string; googleApiKey: string }) => {
    if (!email) return;
    const next = await submitUserCredentials({ email, ...values }, signedInAsThisUser ? accessToken : null);
    setState(next);
    setIsEditing(false);
  };

  const remove = async () => {
    if (!accessToken || !window.confirm('Stop using your own Google credentials? You will sign in through this site\'s Google app instead.')) return;
    setBusy(true);
    setActionError(null);
    try {
      setState(await removeUserCredentials(accessToken));
    } catch (err) {
      setActionError(message(err, 'Could not remove your credentials.'));
    } finally {
      setBusy(false);
    }
  };

  let content;
  if (!userCredentialsAvailable()) {
    content = (
      <Card>
        <h2 className="text-xl font-semibold text-gray-800">Not available here</h2>
        <p className="text-gray-600">
          Personal Google credentials are stored by a Netlify Function, so this page only works on the deployed Netlify site.
        </p>
      </Card>
    );
  } else if (!email) {
    content = (
      <Card>
        <h2 className="text-xl font-semibold text-gray-800">Use your own Google credentials</h2>
        <p className="text-gray-600">
          Sign in and publish through your own Google Cloud project: your OAuth Client ID for sign-in, and your API key for
          visitors loading your portfolio.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            choose(emailInput);
          }}
          className="space-y-2"
        >
          <label htmlFor="accountEmail" className="dash-label">Your Gmail address</label>
          <div className="flex gap-2">
            <input id="accountEmail" type="email" required className="dash-input" placeholder="you@gmail.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            <button type="submit" className="btn-primary shrink-0">
              <ArrowRight size={18} /> Continue
            </button>
          </div>
        </form>
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      </Card>
    );
  } else if (state === undefined) {
    content = (
      <Card>
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 size={18} className="animate-spin text-purple-600" /> Checking {email}…
        </p>
      </Card>
    );
  } else if (state === null) {
    content = (
      <Card>
        <p className="text-red-600">Couldn't reach the account service. Check your connection and try again.</p>
        <button type="button" className="btn-secondary" onClick={() => choose(email)}>Try again</button>
      </Card>
    );
  } else if (verified) {
    content = (
      <Card>
        <div className="flex items-center gap-3 text-green-700">
          <CheckCircle2 size={28} />
          <h2 className="text-xl font-semibold">Your credentials are confirmed</h2>
        </div>
        <p className="text-gray-600">
          From now on you sign in through your own Google app, and visitors load your portfolio with your own API key.
        </p>
        <Link to="/dashboard" className="btn-primary">Open my dashboard</Link>
      </Card>
    );
  } else if (state.pending && !isEditing) {
    const pending = state.pending;
    content = (
      <Card>
        <h2 className="text-xl font-semibold text-gray-800">Confirm with Google</h2>
        <p className="text-gray-600">
          Sign in as <strong>{pending.email}</strong> through your new Client ID. This checks that it works and that the email is
          yours. Your credentials are used only after this.
        </p>
        <Summary creds={pending} />
        {actionError && (
          <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {actionError}
          </p>
        )}
        {authError && <p className="text-sm text-red-600">{authError}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => confirmPending(pending)} disabled={isLoading || busy}>
            {isLoading || busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            Sign in with Google to confirm
          </button>
          <button type="button" className="btn-secondary" onClick={() => setIsEditing(true)}>
            <Pencil size={16} /> Edit
          </button>
        </div>
        <SignInHelp issue={issue} ownApp />
      </Card>
    );
  } else if (state.verified && !isEditing) {
    const current = state.verified;
    content = (
      <Card>
        <div className="flex items-center gap-3 text-green-700">
          <CheckCircle2 size={24} />
          <h2 className="text-xl font-semibold">You're using your own Google credentials</h2>
        </div>
        <Summary creds={current} />
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
        {signedInAsThisUser ? (
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-secondary" onClick={() => setIsEditing(true)}>
              <Pencil size={16} /> Change
            </button>
            <button type="button" className="btn-secondary hover:text-red-600" onClick={remove} disabled={busy}>
              <Trash2 size={16} /> Stop using my own credentials
            </button>
            <Link to="/dashboard" className="btn-primary">Open my dashboard</Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Sign in as {current.email} to change or remove them.</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => login({ clientId: current.googleClientId, email: current.email })}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />} Sign in with Google
            </button>
            {isAuthenticated && (
              <p className="text-xs text-gray-500">
                Signed in as {user?.email}.{' '}
                <button type="button" className="underline" onClick={logout}>Sign out</button>
              </p>
            )}
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <SignInHelp issue={issue} ownApp />
          </div>
        )}
      </Card>
    );
  } else {
    const replacingVerified = Boolean(state.verified);
    content = (
      <Card>
        <h2 className="text-xl font-semibold text-gray-800">{state.verified || state.pending ? 'Edit your credentials' : 'Add your Google credentials'}</h2>
        <CredentialsForm
          email={email}
          initial={state.pending ?? state.verified}
          onSubmit={save}
          onCancel={state.verified || state.pending ? () => setIsEditing(false) : undefined}
        />
        {replacingVerified && (
          <p className="text-xs text-gray-500">Your current credentials stay in use until you confirm the new ones.</p>
        )}
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-50 p-3">
              <UserCog size={24} className="text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">My Google credentials</h1>
          </div>
          {email && (
            <button
              type="button"
              className="text-sm text-purple-600 underline"
              onClick={() => {
                setEmail(null);
                setIsEditing(false);
                setVerified(false);
              }}
            >
              Use a different email
            </button>
          )}
        </div>
        {content}
      </div>
    </div>
  );
};

export default AccountView;

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, KeyRound, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isGoogleConfigured } from '../config/googleConfig';
import { fetchUserCredentials, userCredentialsAvailable, type UserCredentialsState } from '../services/userCredentials';
import { isGmail, usernameFromEmail } from '../utils/username';
import SignInHelp from './SignInHelp';

const shortId = (clientId: string) => `${clientId.split('.')[0].slice(0, 14)}…`;

/**
 * Dashboard sign-in. Where per-user credentials are available, asks for the Gmail
 * address first so the sign-in can go through that user's own Google Client ID
 * (registered at /account), falling back to the site's.
 */
const SignInPanel = () => {
  const { login, isLoading, error, issue, lastLogin } = useAuth();
  const [email, setEmail] = useState(lastLogin?.email ?? '');
  const [lookup, setLookup] = useState<{ email: string; creds: UserCredentialsState | null } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const siteSignIn = isGoogleConfigured();

  const signInButton = (onClick: () => void, label = 'Sign in with Google') => (
    <button type="button" className="btn-primary" onClick={onClick} disabled={isLoading}>
      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
      {label}
    </button>
  );

  // Static hosts / local dev: no per-user credentials, only the site's sign-in.
  if (!userCredentialsAvailable()) {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        {siteSignIn ? (
          signInButton(() => login())
        ) : (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {import.meta.env.DEV ? (
              <>
                Google login isn't configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.local</code> and restart the
                dev server.
              </>
            ) : (
              <>
                Google login isn't set up on this site yet. If you deployed it,{' '}
                <Link to="/setup" className="font-medium underline">open the setup page</Link>.
              </>
            )}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {siteSignIn && <SignInHelp issue={issue} />}
      </div>
    );
  }

  const handleContinue = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!isGmail(value)) {
      setFormError('Enter a Gmail address (…@gmail.com).');
      return;
    }
    setFormError(null);
    setIsChecking(true);
    const creds = await fetchUserCredentials(usernameFromEmail(value), { fresh: true });
    setIsChecking(false);
    setLookup({ email: value, creds });
  };

  if (!lookup) {
    return (
      <form onSubmit={handleContinue} className="flex w-full flex-col gap-3 text-left">
        <label htmlFor="signInEmail" className="dash-label !mb-0">Your Gmail address</label>
        <div className="flex gap-2">
          <input
            id="signInEmail"
            type="email"
            autoComplete="email"
            className="dash-input"
            placeholder="you@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary shrink-0" disabled={isChecking}>
            {isChecking ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            Continue
          </button>
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </form>
    );
  }

  const { creds } = lookup;
  const accountLink = `/account?email=${encodeURIComponent(lookup.email)}`;
  const ownApp = Boolean(creds?.verified);

  let body;
  if (creds?.verified) {
    const own = creds.verified;
    body = (
      <>
        {signInButton(() => login({ clientId: own.googleClientId, email: lookup.email }))}
        <p className="text-xs text-gray-500">
          Using your own Google app (Client ID <code>{shortId(own.googleClientId)}</code>).{' '}
          <Link to={accountLink} className="underline">Manage</Link>
        </p>
      </>
    );
  } else if (creds?.pending) {
    body = (
      <>
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your Google credentials are saved but not confirmed yet.
        </p>
        <Link to={accountLink} className="btn-primary">
          <KeyRound size={18} /> Confirm my credentials
        </Link>
        {siteSignIn && (
          <button type="button" className="text-sm text-gray-500 underline" onClick={() => login({ email: lookup.email })}>
            or sign in with this site's Google app instead
          </button>
        )}
      </>
    );
  } else {
    body = siteSignIn ? (
      <>
        {signInButton(() => login({ email: lookup.email }))}
        <Link to={accountLink} className="text-sm text-gray-500 underline hover:text-purple-700">
          Prefer your own Google Client ID and API key? Set them up
        </Link>
      </>
    ) : (
      <>
        <p className="text-sm text-gray-600">To start, connect your own Google credentials (Client ID and API key).</p>
        <Link to={accountLink} className="btn-primary">
          <KeyRound size={18} /> Set up my Google credentials
        </Link>
      </>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-sm text-gray-600">
        <strong>{lookup.email}</strong>{' '}
        <button type="button" className="text-purple-600 underline" onClick={() => setLookup(null)}>
          change
        </button>
      </p>
      {body}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <SignInHelp issue={issue} ownApp={ownApp} />
    </div>
  );
};

export default SignInPanel;

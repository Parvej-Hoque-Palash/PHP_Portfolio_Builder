import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ExternalLink, HelpCircle, ShieldAlert } from 'lucide-react';
import type { SignInIssue } from '../context/auth';

const AUDIENCE_URL = 'https://console.cloud.google.com/auth/audience';

/** Steps for the site owner to let every Gmail account sign in. */
export const PublishAppSteps = () => (
  <ol className="list-decimal space-y-1.5 pl-5">
    <li>
      Open{' '}
      <a href={AUDIENCE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline">
        Google Cloud Console → Google Auth Platform → Audience <ExternalLink size={12} />
      </a>{' '}
      for the project that owns this site's Client ID. (Older consoles call it <em>APIs &amp; Services → OAuth consent screen</em>.)
    </li>
    <li>
      Under <strong>Publishing status</strong> it says <strong>Testing</strong>. Click <strong>Publish app</strong> and confirm.
    </li>
    <li>Try signing in again. It works right away for every Gmail account.</li>
  </ol>
);

interface SignInHelpProps {
  /** Why the last attempt failed; null shows only the "Trouble signing in?" link. */
  issue: SignInIssue | null;
  /** Signing in through the user's own Google app: the fix is theirs, not the site owner's. */
  ownApp?: boolean;
}

/** Explains failed Google sign-ins, above all "Error 403: access_denied" from an app in Testing mode. */
const SignInHelp = ({ issue, ownApp = false }: SignInHelpProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (issue === 'popup-blocked') {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-left text-sm text-amber-800 ring-1 ring-amber-200">
        Your browser blocked the Google sign-in window. Allow pop-ups for this site (look for the icon in the address bar),
        then click <strong>Sign in with Google</strong> again.
      </p>
    );
  }

  const expanded = isOpen || issue === 'interrupted';

  return (
    <div className="w-full text-left text-sm">
      {issue === 'interrupted' ? (
        <p className="mb-2 flex items-center gap-2 font-medium text-gray-700">
          <HelpCircle size={16} className="shrink-0 text-purple-600" /> Sign-in didn't finish.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className="mx-auto flex items-center gap-1.5 text-gray-500 hover:text-purple-700"
        >
          <HelpCircle size={15} /> Trouble signing in?
          <ChevronDown size={15} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-3 rounded-lg bg-amber-50 px-4 py-3 text-amber-900 ring-1 ring-amber-200">
              <p className="flex items-start gap-2">
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                {ownApp ? (
                  <span>
                    Did Google show <strong>"Error 403: access_denied"</strong>? Your own Google app (the Client ID you
                    registered) is still in <strong>Testing</strong> mode. Publish it, or add your Gmail as a test user:
                  </span>
                ) : (
                  <span>
                    Did Google show <strong>"Error 403: access_denied"</strong>? This site's Google sign-in is still in{' '}
                    <strong>Testing</strong> mode, so Google only lets in a few approved accounts. Your account is fine. The
                    site owner needs to open sign-in to everyone.
                  </span>
                )}
              </p>
              {!ownApp && (
                <p>
                  <strong>Not the owner?</strong> Please let the site owner know. It takes them about a minute.
                </p>
              )}
              <div>
                <p className="mb-1.5 font-semibold">{ownApp ? "Here's the fix:" : "Own this site? Here's the fix:"}</p>
                <PublishAppSteps />
                <p className="mt-2 text-xs text-amber-800">
                  This site only asks for name, email and access to the files it creates itself, so Google doesn't require an
                  app review to publish. To keep it private instead, add each person under <strong>Test users</strong> on the
                  same page.
                </p>
              </div>
              <p className="text-xs text-amber-800">If you just closed the window yourself, simply click Sign in with Google again.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignInHelp;

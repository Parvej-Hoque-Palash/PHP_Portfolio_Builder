import { useEffect, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Copy, Globe, Link2, Loader2, RefreshCw } from 'lucide-react';
import { googleConfig, isDefaultUsername } from '../../config/googleConfig';
import { resolveConfigFileId } from '../../services/portfolioRegistry';
import { publicPortfolioUrl } from '../../services/driveService';

interface PublishInfoProps {
  username: string;
  /** Drive ID of this account's portfolio_config.json (null until first save). */
  configFileId: string | null;
  /** Changes when the personal-URL registry was updated, to re-check the listing. */
  registryVersion?: number;
  /** Why the last attempt to claim the personal URL failed, if it did. */
  registryError?: string | null;
  onRetryRegistry?: () => void;
}

const CopyLine = ({ text, buttonLabel }: { text: string; buttonLabel?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the value is still selectable */
    }
  };
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 min-w-0 truncate rounded-lg bg-white px-3 py-2 ring-1 ring-blue-100">{text}</code>
      {buttonLabel ? (
        <button type="button" className="btn-secondary shrink-0" onClick={copy}>
          {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          {copied ? 'Copied!' : buttonLabel}
        </button>
      ) : (
        <button type="button" className="btn-icon" onClick={copy} title="Copy">
          {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
        </button>
      )}
    </div>
  );
};

/** Shows the account's public URL and what's needed for visitors to see it. */
const PublishInfo = ({ username, configFileId, registryVersion, registryError, onRetryRegistry }: PublishInfoProps) => {
  const [listedFileId, setListedFileId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    resolveConfigFileId(username).then((id) => !cancelled && setListedFileId(id));
    return () => {
      cancelled = true;
    };
  }, [username, registryVersion]);

  if (!username) return null;

  const path = isDefaultUsername(username) ? '/' : `/${username}`;
  const url = `${window.location.origin}${path}`;
  const isLive = Boolean(configFileId && listedFileId === configFileId && googleConfig.apiKey);

  return (
    <div className="rounded-xl bg-blue-50 px-4 py-4 text-sm text-blue-900 ring-1 ring-blue-200 space-y-3">
      <p className="flex flex-wrap items-center gap-2 font-medium">
        <Globe size={18} /> Your portfolio:
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline decoration-blue-300 hover:decoration-blue-600">
          {url}
        </a>
        {isLive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            <CheckCircle2 size={12} /> Public
          </span>
        )}
      </p>

      {!configFileId && <p>Click Save &amp; Publish once to create your portfolio file in Google Drive and get a shareable link.</p>}

      {configFileId && (
        <div className="space-y-2 rounded-lg bg-white/60 p-3 ring-1 ring-blue-100">
          <p className="flex items-center gap-2 font-medium">
            <Link2 size={16} /> Shareable link — anyone can open it, no sign-in needed. Add it to your CV.
          </p>
          <CopyLine text={publicPortfolioUrl(configFileId)} buttonLabel="Copy Link" />
        </div>
      )}

      {configFileId && listedFileId !== undefined && listedFileId !== configFileId && (
        registryError ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-amber-200">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="flex-1 min-w-0">
              Your personal URL isn't active yet: {registryError} The shareable link above already works.
            </span>
            {onRetryRegistry && (
              <button type="button" className="btn-secondary" onClick={onRetryRegistry}>
                <RefreshCw size={14} /> Retry
              </button>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-blue-800/80">
            <Loader2 size={14} className="animate-spin" /> Activating your personal URL…
          </p>
        )
      )}

      {configFileId && !googleConfig.apiKey && (
        <p className="text-xs text-blue-800/80">
          Visitors can't load your portfolio yet: set <code>VITE_GOOGLE_API_KEY</code> (in Netlify: Site configuration →
          Environment variables) and redeploy.
        </p>
      )}
    </div>
  );
};

export default PublishInfo;

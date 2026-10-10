import { useEffect, useState } from 'react';
import { Check, CheckCircle2, Copy, Globe } from 'lucide-react';
import { googleConfig, isDefaultUsername } from '../../config/googleConfig';
import { resolveConfigFileId } from '../../services/portfolioRegistry';

interface PublishInfoProps {
  username: string;
  /** Drive ID of this account's portfolio_config.json (null until first save). */
  configFileId: string | null;
  /** Changes when portfolios.json was updated, to re-check the listing. */
  registryVersion?: number;
}

const CopyLine = ({ text }: { text: string }) => {
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
      <button type="button" className="btn-icon" onClick={copy} title="Copy">
        {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
      </button>
    </div>
  );
};

/** Shows the account's public URL and what's needed for visitors to see it. */
const PublishInfo = ({ username, configFileId, registryVersion }: PublishInfoProps) => {
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

      {!configFileId && <p>Save once to create your portfolio file in Google Drive.</p>}

      {configFileId && listedFileId !== undefined && listedFileId !== configFileId && (
        <>
          <p>
            Visitors aren't signed in, so the site finds your file through <code>public/portfolios.json</code>. Saving
            from the local dev server (<code>npm run dev</code>) adds this entry automatically; on the deployed site, add
            it by hand and redeploy:
          </p>
          <CopyLine text={`"${username}": "${configFileId}"`} />
          <p className="text-xs text-blue-800/80">Until then, only you (while signed in) can see your published content.</p>
        </>
      )}

      {configFileId && !googleConfig.apiKey && (
        <p className="text-xs text-blue-800/80">
          The site also needs <code>VITE_GOOGLE_API_KEY</code> set to read public portfolio files.
        </p>
      )}
    </div>
  );
};

export default PublishInfo;

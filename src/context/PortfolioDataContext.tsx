import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { isDefaultUsername } from '../config/googleConfig';
import { DEFAULT_PORTFOLIO } from '../data/defaultPortfolio';
import { useAuth } from '../hooks/useAuth';
import { readPortfolioConfig, readPublicPortfolioConfig } from '../services/driveService';
import { portfolioCache } from '../services/portfolioCache';
import { resolveConfigFileId } from '../services/portfolioRegistry';
import { resolveApiKey } from '../services/userCredentials';
import type { PortfolioData } from '../types/portfolio';
import { createDefaultPortfolio, createEmptyPortfolio, normalizePortfolio } from '../utils/portfolio';
import { usernameFromEmail } from '../utils/username';
import { PortfolioDataContext, type PortfolioDataContextValue, type PortfolioDataStatus } from './portfolioData';

const EMPTY_PORTFOLIO = createEmptyPortfolio();

interface PortfolioDataProviderProps {
  username: string;
  basePath: string;
  children: ReactNode;
}

/**
 * Loads one user's published portfolio_config.json. Sources, in order:
 *  1. a copy saved from the dashboard earlier in this session,
 *  2. the signed-in user's own Drive, when viewing their own portfolio,
 *  3. the public file listed for the username in public/portfolios.json.
 * The default portfolio falls back to the built-in content; any other unknown
 * username is "not-found".
 */
export function PortfolioDataProvider({ username, basePath, children }: PortfolioDataProviderProps) {
  const { accessToken, user } = useAuth();
  const isDefault = isDefaultUsername(username);
  const cached = portfolioCache.get(username);
  const [data, setData] = useState<PortfolioData | null>(cached ?? null);
  const [status, setStatus] = useState<PortfolioDataStatus>(cached ? 'ready' : 'loading');

  const ownToken = accessToken && usernameFromEmail(user?.email) === username ? accessToken : null;

  useEffect(() => {
    if (portfolioCache.get(username)) return;
    let cancelled = false;
    const fallback = () => (isDefault ? createDefaultPortfolio() : createEmptyPortfolio());

    (async (): Promise<unknown> => {
      if (ownToken) {
        const stored = await readPortfolioConfig(ownToken);
        if (stored) return stored.config;
      }
      const fileId = await resolveConfigFileId(username);
      // The owner's own API key if they registered one, else the site's.
      const apiKey = fileId ? await resolveApiKey(username) : '';
      if (fileId && apiKey) return readPublicPortfolioConfig(fileId, apiKey);
      return null;
    })()
      .then((raw) => {
        if (cancelled) return;
        setData(raw ? normalizePortfolio(raw, fallback()) : null);
        setStatus(raw ? 'ready' : isDefault ? 'unavailable' : 'not-found');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.warn(`[PortfolioData] Could not load portfolio "${username}":`, err);
        setStatus(isDefault ? 'error' : 'not-found');
      });
    return () => {
      cancelled = true;
    };
  }, [username, isDefault, ownToken]);

  const value = useMemo<PortfolioDataContextValue>(
    () => ({
      username,
      basePath,
      isDefault,
      data: data ?? (isDefault ? DEFAULT_PORTFOLIO : EMPTY_PORTFOLIO),
      isPublished: data !== null,
      status,
    }),
    [username, basePath, isDefault, data, status],
  );

  return <PortfolioDataContext.Provider value={value}>{children}</PortfolioDataContext.Provider>;
}

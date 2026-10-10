import type { PortfolioData } from '../types/portfolio';

/**
 * Portfolios saved from the dashboard in this browser session, so the public
 * view shows the latest version immediately instead of a possibly stale Drive read.
 */
const saved = new Map<string, PortfolioData>();

export const portfolioCache = {
  get: (username: string): PortfolioData | undefined => saved.get(username),
  set: (username: string, data: PortfolioData): void => void saved.set(username, data),
};

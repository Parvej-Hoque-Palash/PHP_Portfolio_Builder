import { createContext } from 'react';
import type { PortfolioData } from '../types/portfolio';

export type PortfolioDataStatus = 'loading' | 'ready' | 'unavailable' | 'not-found' | 'error';

export interface PortfolioDataContextValue {
  /** Username whose portfolio this is. */
  username: string;
  /** URL prefix for this portfolio's pages: "" for the default portfolio, "/<username>" otherwise. */
  basePath: string;
  /** True for the portfolio at "/", which falls back to the built-in content and assets. */
  isDefault: boolean;
  /** The portfolio content (built-in or blank when nothing is published). */
  data: PortfolioData;
  /** True once content from portfolio_config.json is in use. */
  isPublished: boolean;
  status: PortfolioDataStatus;
}

export const PortfolioDataContext = createContext<PortfolioDataContextValue | null>(null);

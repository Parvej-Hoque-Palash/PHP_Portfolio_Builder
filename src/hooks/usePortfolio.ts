import { useContext } from 'react';
import { PortfolioDataContext, type PortfolioDataContextValue } from '../context/portfolioData';

export function usePortfolio(): PortfolioDataContextValue {
  const ctx = useContext(PortfolioDataContext);
  if (!ctx) throw new Error('usePortfolio must be used within <PortfolioDataProvider>');
  return ctx;
}

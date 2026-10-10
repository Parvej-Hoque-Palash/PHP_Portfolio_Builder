import { usernameFromEmail } from '../utils/username';
import { useAuth } from './useAuth';
import { usePortfolio } from './usePortfolio';

/** True when the signed-in account owns the portfolio being viewed. */
export function useIsOwnPortfolio(): boolean {
  const { isAuthenticated, user } = useAuth();
  const { username } = usePortfolio();
  return isAuthenticated && usernameFromEmail(user?.email) === username;
}

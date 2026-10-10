import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Menu, SearchX, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { googleConfig } from '../config/googleConfig';
import { PortfolioDataProvider } from '../context/PortfolioDataContext';
import { usePortfolio } from '../hooks/usePortfolio';
import { USERNAME_PREFIX, hasUsernamePrefix } from '../utils/username';
import { isPageVisible, layoutIdForPath } from '../utils/layout';

/**
 * Public portfolio shell for "/" (the default portfolio) and "/:username".
 * Each page (Home, About, …, custom sections) renders into the <Outlet />.
 */
const PortfolioView = () => {
  const { username: param } = useParams<{ username?: string }>();
  const { pathname, search, hash } = useLocation();

  // Canonicalise "/MdParvejHoque9/projects" and "/mdparvejhoque9/projects" -> "/php-mdparvejhoque9/projects"
  if (param) {
    const canonical = (hasUsernamePrefix(param) ? param : USERNAME_PREFIX + param).toLowerCase();
    if (canonical !== param) {
      const rest = pathname.slice(param.length + 1);
      return <Navigate to={`/${canonical}${rest}${search}${hash}`} replace />;
    }
  }

  const username = param ?? googleConfig.defaultUsername;
  const basePath = param ? `/${param}` : '';

  return (
    // key: switching portfolios starts from a clean load
    <PortfolioDataProvider key={username} username={username} basePath={basePath}>
      <PortfolioLayout />
    </PortfolioDataProvider>
  );
};

const PortfolioLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data, status, isPublished, username, basePath } = usePortfolio();
  const { pathname } = useLocation();
  const { fullName } = data.header;
  // Pages hidden in the dashboard's Layout tab aren't reachable by URL either.
  const layoutId = layoutIdForPath(pathname.slice(basePath.length));
  const isHidden = layoutId !== null && !isPageVisible(data, layoutId);

  useEffect(() => {
    if (fullName) document.title = `${fullName} | Portfolio`;
  }, [fullName]);

  // Wait for the first load so visitors don't see placeholder content flash.
  if (status === 'loading' && !isPublished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-purple-600" />
      </div>
    );
  }

  if (status === 'not-found') return <PortfolioNotFound username={username} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 md:ml-[300px]">
        {isHidden ? <Navigate to={basePath || '/'} replace /> : <Outlet />}

        {/* Footer */}
        <footer className="fixed bottom-0 w-full mx-auto mt-auto py-2 flex items-center text-center text-sm text-gray-600 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex justify-center items-center h-full">
            Copyright © 2025 {fullName}. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
};

const PortfolioNotFound = ({ username }: { username: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="dash-card max-w-md w-full flex flex-col items-center gap-4 text-center"
    >
      <div className="rounded-full bg-purple-50 p-4">
        <SearchX size={36} className="text-purple-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Portfolio not found</h1>
      <p className="text-gray-600">
        There's no published portfolio for <strong>@{username}</strong> yet.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-secondary">Go to homepage</Link>
        <Link to="/dashboard" className="btn-primary">Create yours</Link>
      </div>
    </motion.div>
  </div>
);

export default PortfolioView;

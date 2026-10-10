import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ExternalLink, HardDrive, Loader2, LogIn, LogOut, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePortfolioEditor } from '../hooks/usePortfolioEditor';
import { isGoogleConfigured, isDefaultUsername } from '../config/googleConfig';
import { portfolioCache } from '../services/portfolioCache';
import { registerPortfolio } from '../services/portfolioRegistry';
import type { PortfolioData } from '../types/portfolio';
import { createDefaultPortfolio, createEmptyPortfolio } from '../utils/portfolio';
import { usernameFromEmail } from '../utils/username';
import HeaderEditor from '../components/dashboard/HeaderEditor';
import SectionManager from '../components/dashboard/SectionManager';
import LayoutEditor from '../components/dashboard/LayoutEditor';
import ResumeEditor from '../components/dashboard/ResumeEditor';
import SaveBar from '../components/dashboard/SaveBar';
import PublishInfo from '../components/dashboard/PublishInfo';
import DashboardTabs, { type DashboardTab } from '../components/dashboard/DashboardTabs';
import HomeEditor from '../components/dashboard/editors/HomeEditor';
import AboutEditor from '../components/dashboard/editors/AboutEditor';
import SkillsEditor from '../components/dashboard/editors/SkillsEditor';
import ProjectsEditor from '../components/dashboard/editors/ProjectsEditor';
import ResearchEditor from '../components/dashboard/editors/ResearchEditor';
import ExperienceEditor from '../components/dashboard/editors/ExperienceEditor';
import EducationEditor from '../components/dashboard/editors/EducationEditor';
import ContactEditor from '../components/dashboard/editors/ContactEditor';

const SignInCard = ({ onLogin, isLoading, error }: { onLogin: () => void; isLoading: boolean; error: string | null }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="dash-card max-w-md mx-auto mt-12 flex flex-col items-center gap-4 text-center"
  >
    <div className="rounded-full bg-purple-50 p-4">
      <HardDrive size={36} className="text-purple-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800">Portfolio Dashboard</h2>
    <p className="text-gray-600">
      Sign in with your <strong>Gmail</strong> account to edit your portfolio. Your content is saved to a{' '}
      <strong>My Portfolio Data</strong> folder in your own Google Drive.
    </p>
    {isGoogleConfigured() ? (
      <button type="button" className="btn-primary" onClick={onLogin} disabled={isLoading}>
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
        Sign in with Google
      </button>
    ) : (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {/* VITE_* values are baked in at build time, so a deployed site needs them set on the host. */}
        {import.meta.env.DEV ? (
          <>
            Google login isn't configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.local</code> and restart
            the dev server.
          </>
        ) : (
          <>
            Google login isn't set up on this site yet. If you deployed it,{' '}
            <Link to="/setup" className="font-medium underline">open the setup page</Link> to connect your Google credentials.
          </>
        )}
      </p>
    )}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </motion.div>
);

const DashboardView = () => {
  const { user, accessToken, isAuthenticated, isLoading: authLoading, error: authError, login, logout } = useAuth();
  // Remember the account's username across a session expiry (when `user` becomes null).
  const [username, setUsername] = useState('');
  useEffect(() => {
    if (user) setUsername(usernameFromEmail(user.email));
  }, [user]);

  const userName = user?.name ?? '';
  // Personal URL (/php-…) registration, done automatically after every Save & Publish.
  // registryVersion bumps when the registry changed, so PublishInfo re-checks it.
  const [registryVersion, setRegistryVersion] = useState(0);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const claimPersonalUrl = useCallback(
    (fileId: string) => {
      if (!accessToken || !username) return;
      registerPortfolio(accessToken, username, fileId).then((result) => {
        setRegistryError(result.ok ? null : result.error);
        if (result.ok && result.changed) setRegistryVersion((v) => v + 1);
      });
    },
    [accessToken, username],
  );
  const editor = usePortfolioEditor(accessToken, user?.id ?? null, {
    // The default portfolio's owner starts from the built-in content; everyone else starts blank.
    createInitial: useCallback(
      () => (user && isDefaultUsername(usernameFromEmail(user.email)) ? createDefaultPortfolio() : createEmptyPortfolio(userName)),
      [user, userName],
    ),
    onSaved: useCallback(
      (saved: PortfolioData, configFileId: string) => {
        portfolioCache.set(username, saved);
        claimPersonalUrl(configFileId);
      },
      [username, claimPersonalUrl],
    ),
  });
  const { isDirty, configFileId } = editor;

  // Portfolios saved before personal URLs were automatic get theirs on the next visit.
  useEffect(() => {
    if (configFileId) claimPersonalUrl(configFileId);
  }, [configFileId, claimPersonalUrl]);
  const [tab, setTab] = useState<DashboardTab>('profile');

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const hasLoaded = editor.status === 'ready';

  // Before the first successful load, signing in is the only thing to do.
  if (!isAuthenticated && !hasLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <SignInCard onLogin={login} isLoading={authLoading} error={authError} />
      </div>
    );
  }

  const portfolioPath = isDefaultUsername(username) ? '/' : `/${username}`;

  const handleLogout = () => {
    if (!isDirty || window.confirm('You have unsaved changes. Sign out anyway?')) {
      editor.clear();
      logout();
    }
  };

  const renderTab = () => {
    const { data, actions } = editor;
    switch (tab) {
      case 'profile':
        return <HeaderEditor header={data.header} onChange={actions.updateHeader} />;
      case 'layout':
        return <LayoutEditor data={data} isDefault={isDefaultUsername(username)} actions={actions} />;
      case 'home':
        return <HomeEditor value={data.home} onChange={(v) => actions.setContent('home', v)} />;
      case 'about':
        return <AboutEditor value={data.about} onChange={(v) => actions.setContent('about', v)} />;
      case 'skills':
        return <SkillsEditor value={data.skills} onChange={(v) => actions.setContent('skills', v)} />;
      case 'projects':
        return <ProjectsEditor value={data.projects} onChange={(v) => actions.setContent('projects', v)} />;
      case 'research':
        return <ResearchEditor value={data.research} onChange={(v) => actions.setContent('research', v)} />;
      case 'experience':
        return <ExperienceEditor value={data.experience} onChange={(v) => actions.setContent('experience', v)} />;
      case 'education':
        return <EducationEditor value={data.education} onChange={(v) => actions.setContent('education', v)} />;
      case 'contact':
        return <ContactEditor value={data.contact} onChange={(v) => actions.setContent('contact', v)} />;
      case 'resume':
        return <ResumeEditor resume={data.header.resume} isDefault={isDefaultUsername(username)} onChange={(resume) => actions.updateHeader({ resume })} />;
      case 'sections':
        return <SectionManager data={data} actions={actions} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto mb-16 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="page-title !mb-1">Dashboard</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {username && (
                <Link to={portfolioPath} className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800">
                  View my portfolio <ExternalLink size={14} />
                </Link>
              )}
              {/* The site owner manages the deployment's Google settings */}
              {username && isDefaultUsername(username) && (
                <a href="/setup" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-purple-700">
                  <Settings size={14} /> Site settings
                </a>
              )}
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-2 shadow">
              {user.picture ? (
                <img src={user.picture} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-medium text-white">
                  {user.name.charAt(0)}
                </span>
              )}
              <span className="hidden sm:block text-sm text-gray-700">{user.email}</span>
              <button type="button" className="btn-icon" onClick={handleLogout} title="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Session expired mid-edit: keep local edits on screen and offer re-auth. */}
        {!isAuthenticated && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-800 ring-1 ring-amber-200">
            <AlertTriangle size={20} className="shrink-0" />
            <span className="flex-1 text-sm">Your Google session expired. Sign in again to save; your edits are kept.</span>
            <button type="button" className="btn-secondary" onClick={login} disabled={authLoading}>
              <LogIn size={16} /> Sign in
            </button>
          </div>
        )}

        {editor.status === 'loading' && (
          <div className="dash-card flex items-center justify-center gap-3 py-16 text-gray-600">
            <Loader2 size={22} className="animate-spin text-purple-600" /> Loading your portfolio from Google Drive…
          </div>
        )}

        {editor.status === 'error' && (
          <div className="dash-card flex flex-col items-center gap-4 py-12 text-center">
            <AlertTriangle size={36} className="text-red-500" />
            <p className="text-gray-700">Couldn't load your portfolio data.</p>
            <p className="text-sm text-red-600">{editor.loadError}</p>
            <button type="button" className="btn-secondary" onClick={editor.reload}>
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        )}

        {hasLoaded && (
          <>
            <SaveBar
              isDirty={isDirty}
              isSaving={editor.isSaving}
              canSave={isAuthenticated}
              error={editor.saveError}
              lastSavedAt={editor.lastSavedAt}
              onSave={editor.save}
              onDiscard={editor.discard}
            />
            <PublishInfo
              username={username}
              configFileId={configFileId}
              registryVersion={registryVersion}
              registryError={registryError}
              onRetryRegistry={configFileId ? () => claimPersonalUrl(configFileId) : undefined}
            />
            <DashboardTabs active={tab} onChange={setTab} />
            {renderTab()}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardView;

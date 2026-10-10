import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { PortfolioDataContext, type PortfolioDataContextValue } from '../context/portfolioData';
import { googleConfig } from '../config/googleConfig';
import { MISSING_API_KEY_MESSAGE, fetchPublicPortfolio } from '../services/driveService';
import type { PortfolioData } from '../types/portfolio';
import { STANDARD_PAGE_LABELS, isStandardPage, sectionIdOf, standardPageHasContent, type StandardPage } from '../utils/layout';
import { createEmptyPortfolio, normalizePortfolio, publicSections } from '../utils/portfolio';
import BlockRenderer from '../components/portfolio/BlockRenderer';
import Home from './Home';
import About from './About';
import Skills from './Skills';
import Projects from './Projects';
import Research from './Research';
import Experience from './Experience';
import Education from './Education';
import Contact from './Contact';
import Resume from './Resume';

const PAGES: Record<StandardPage, ComponentType> = {
  home: Home,
  about: About,
  skills: Skills,
  projects: Projects,
  research: Research,
  experience: Experience,
  education: Education,
  contact: Contact,
  resume: Resume,
};

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: PortfolioData };

/**
 * Sign-in-free view of a published portfolio at /portfolio?id=<Drive file ID>.
 * Every visible page is shown on one scrolling page, in the owner's Layout order.
 */
const PublicPortfolioView = () => {
  const [searchParams] = useSearchParams();
  const fileId = searchParams.get('id')?.trim() ?? '';
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!googleConfig.apiKey) return; // shown as a configuration warning below; nothing to fetch with
    if (!fileId) {
      setState({ status: 'error', message: 'This link is missing the portfolio ID (?id=…).' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    fetchPublicPortfolio(fileId)
      .then((raw) => !cancelled && setState({ status: 'ready', data: normalizePortfolio(raw, createEmptyPortfolio()) }))
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof DOMException && err.name === 'TimeoutError'
            ? 'Google Drive took too long to respond.'
            : err instanceof Error
              ? err.message
              : 'Could not load this portfolio.';
        setState({ status: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, [fileId, attempt]);

  const fullName = state.status === 'ready' ? state.data.header.fullName : '';
  useEffect(() => {
    if (fullName) document.title = `${fullName} | Portfolio`;
  }, [fullName]);

  // Visitors can't read Drive files without the site's browser API key.
  if (!googleConfig.apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div role="alert" className="max-w-md w-full flex flex-col items-center gap-4 rounded-2xl bg-amber-50 p-8 text-center ring-1 ring-amber-200">
          <div className="rounded-full bg-amber-100 p-4">
            <KeyRound size={32} className="text-amber-700" />
          </div>
          <h1 className="text-xl font-bold text-amber-900">Site configuration needed</h1>
          <p className="text-amber-800">{MISSING_API_KEY_MESSAGE}</p>
          <a href="/setup" className="text-sm font-medium text-amber-900 underline">Site owner: open the setup page</a>
        </div>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 bg-gray-50 text-gray-600">
        <Loader2 size={28} className="animate-spin text-purple-600" /> Loading portfolio…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-card max-w-md w-full flex flex-col items-center gap-4 text-center"
        >
          <div className="rounded-full bg-red-50 p-4">
            <AlertTriangle size={36} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Couldn't open this portfolio</h1>
          <p className="text-gray-600">{state.message}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {fileId && (
              <button type="button" className="btn-secondary" onClick={() => setAttempt((n) => n + 1)}>
                <RefreshCw size={16} /> Try again
              </button>
            )}
            <Link to="/dashboard" className="btn-primary">Create yours</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <PortfolioPage data={state.data} />;
};

interface PageEntry {
  id: string;
  label: string;
  render: () => JSX.Element;
}

const PortfolioPage = ({ data }: { data: PortfolioData }) => {
  const context = useMemo<PortfolioDataContextValue>(
    () => ({ username: '', basePath: '/portfolio', isDefault: false, data, isPublished: true, status: 'ready' }),
    [data],
  );

  // Visible pages with content, in the owner's Layout order.
  const sections = new Map(publicSections(data).map((s) => [s.id, s]));
  const pages: PageEntry[] = [];
  for (const { id, visible } of data.layout) {
    if (!visible) continue;
    if (isStandardPage(id)) {
      if (!standardPageHasContent(data, id, false)) continue;
      const Page = PAGES[id];
      pages.push({ id, label: STANDARD_PAGE_LABELS[id], render: () => <Page /> });
    } else {
      const section = sections.get(sectionIdOf(id) ?? '');
      if (!section) continue;
      pages.push({
        id: `section-${section.id}`,
        label: section.title,
        render: () => (
          <div className="max-w-4xl mx-auto">
            <h1 className="page-title">{section.title}</h1>
            <div className="space-y-6">
              {section.blocks.map((block) => (
                <div key={block.id} className="bg-white rounded-xl shadow-lg p-6">
                  <BlockRenderer block={block} />
                </div>
              ))}
            </div>
          </div>
        ),
      });
    }
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <PortfolioDataContext.Provider value={context}>
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-40 bg-white/90 shadow-sm backdrop-blur">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-gray-800">{data.header.fullName}</p>
              {data.header.designation && <p className="truncate text-sm font-medium text-purple-600">{data.header.designation}</p>}
            </div>
            <nav className="-mx-4 flex flex-1 gap-1 overflow-x-auto px-4 md:mx-0 md:justify-end md:px-0" aria-label="Portfolio sections">
              {pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => scrollTo(page.id)}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-purple-50 hover:text-purple-700"
                >
                  {page.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="px-4 md:px-8">
          {pages.map((page) => (
            <section key={page.id} id={page.id} className="scroll-mt-24 py-10 border-b border-gray-100 last:border-0">
              {page.render()}
            </section>
          ))}
        </main>

        <footer className="py-6 text-center text-sm text-gray-600 bg-gradient-to-r from-purple-50 to-blue-50">
          Copyright © {new Date().getFullYear()} {data.header.fullName}. All rights reserved.
        </footer>
      </div>
    </PortfolioDataContext.Provider>
  );
};

export default PublicPortfolioView;

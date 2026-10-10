import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Skills from './pages/Skills';
import Projects from './pages/Projects';
import Research from './pages/Research';
import ResearchInterest from './pages/ResearchInterest';
import Education from './pages/Education';
import Contact from './pages/Contact';
import Resume from './pages/Resume';
import Experience from './pages/Experience';
import DashboardView from './pages/DashboardView';
import SectionPage from './pages/SectionPage';
import PortfolioView from './pages/PortfolioView';
import PublicPortfolioView from './pages/PublicPortfolioView';
import SetupView from './pages/SetupView';

// Pages of a portfolio, mounted both under "/" (default portfolio) and "/:username".
// Usernames always start with "php-" (utils/username.ts), so they can't clash with
// static first segments like "/about", which mean the default portfolio's page.
const portfolioPages = (
  <>
    <Route index element={<Home />} />
    <Route path="about" element={<About />} />
    <Route path="skills" element={<Skills />} />
    <Route path="projects" element={<Projects />} />
    <Route path="research" element={<Research />} />
    <Route path="experience" element={<Experience />} />
    <Route path="research_interest" element={<ResearchInterest />} />
    <Route path="education" element={<Education />} />
    <Route path="contact" element={<Contact />} />
    <Route path="resume" element={<Resume />} />
    <Route path="section/:sectionId" element={<SectionPage />} />
  </>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<DashboardView />} />
        {/* Shareable, sign-in-free link: /portfolio?id=<Drive file ID> */}
        <Route path="/portfolio" element={<PublicPortfolioView />} />
        {/* One-time site setup by the deployer (Google Client ID + API key) */}
        <Route path="/setup" element={<SetupView />} />
        <Route path="/" element={<PortfolioView />}>
          {portfolioPages}
        </Route>
        <Route path="/:username" element={<PortfolioView />}>
          {portfolioPages}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

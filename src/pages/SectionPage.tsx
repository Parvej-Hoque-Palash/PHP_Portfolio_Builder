import { motion } from 'framer-motion';
import { Navigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePortfolio } from '../hooks/usePortfolio';
import { publicSections } from '../utils/portfolio';
import BlockRenderer from '../components/portfolio/BlockRenderer';

/** Public view of a custom section created in the dashboard. */
const SectionPage = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { data, status, basePath } = usePortfolio();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-gray-500">
        <Loader2 size={22} className="animate-spin text-purple-600" /> Loading…
      </div>
    );
  }

  const section = publicSections(data).find((s) => s.id === sectionId);
  if (!section) return <Navigate to={basePath || '/'} replace />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto mb-16">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-title">
        {section.title}
      </motion.h1>

      <div className="space-y-6">
        {section.blocks.map((block, i) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <BlockRenderer block={block} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SectionPage;

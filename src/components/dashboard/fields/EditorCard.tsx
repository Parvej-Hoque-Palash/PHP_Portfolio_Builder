import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EditorCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

const EditorCard = ({ title, description, children }: EditorCardProps) => (
  <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="dash-card">
    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    <div className="mt-5 space-y-5">{children}</div>
  </motion.section>
);

export default EditorCard;

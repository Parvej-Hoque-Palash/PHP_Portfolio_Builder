import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

import { usePortfolio } from '../hooks/usePortfolio';
import { nonEmpty } from '../utils/portfolio';

// Stagger container for bullet points
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

const Experience = () => {
  const experiences = usePortfolio().data.experience;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto mb-12"
    >
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-title"
      >
        Experience
      </motion.h1>

      <div className="space-y-8">
        {experiences.map((experience, index) => (
          <motion.div
            key={experience.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.4, ease: 'easeOut' }}
            whileHover={{ y: -4, boxShadow: '0 20px 30px -12px rgba(0,0,0,0.15)' }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-start space-x-4">
              <motion.div
                whileHover={{ rotate: -8, scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                className="bg-purple-100 p-3 rounded-lg shrink-0"
              >
                <Briefcase className="text-purple-600" size={24} />
              </motion.div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <motion.span
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: index * 0.15 + 0.2, duration: 0.35 }}
                        style={{ originY: 0 }}
                        className="w-1.5 h-5 bg-purple-600 rounded-full shrink-0"
                      />
                      <h3 className="text-xl font-bold text-gray-800">{experience.organisation}</h3>
                    </div>
                    <p className="font-medium">
                      <span className="font-bold">Designation: </span>
                      <span className="text-purple-600">{experience.role}</span>
                    </p>
                    <p className="font-medium">
                      <span className="font-bold">Period: </span>
                      {experience.period}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-gray-600">
                  <span className="font-bold">Summary: </span>
                  <motion.ul
                    variants={listVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="list-disc list-inside mt-1 space-y-1.5"
                  >
                    {nonEmpty(experience.summary).map((point, idx) => (
                      <motion.li
                        key={idx}
                        variants={itemVariants}
                        whileHover={{ x: 4, color: '#7e22ce' }}
                        className="transition-colors"
                      >
                        {point}
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Experience;
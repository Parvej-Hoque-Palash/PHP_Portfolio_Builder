import { motion } from 'framer-motion';
import { GraduationCap, Calendar, MapPin } from 'lucide-react';

import { usePortfolio } from '../hooks/usePortfolio';
import { nonEmpty } from '../utils/portfolio';

const Education = () => {
  const education = usePortfolio().data.education;

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
        Education
      </motion.h1>

      <div className="relative space-y-8">
        {/* Timeline line connecting the degrees chronologically */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut', delay: 0.2 }}
          style={{ originY: 0 }}
          className="hidden sm:block absolute left-[38px] top-8 bottom-8 w-px bg-purple-200 -z-0"
        />

        {education.map((edu, index) => {
          const achievements = nonEmpty(edu.achievements);
          return (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.4, ease: 'easeOut' }}
              whileHover={{ y: -4, boxShadow: '0 20px 30px -12px rgba(0,0,0,0.15)' }}
              className="relative bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <motion.div
                    whileHover={{ rotate: -8, scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                    className="bg-purple-100 p-3 rounded-lg shrink-0 relative z-10 ring-4 ring-white"
                  >
                    <GraduationCap className="text-purple-600" size={24} />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <motion.span
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: index * 0.15 + 0.25, duration: 0.35 }}
                        style={{ originY: 0 }}
                        className="w-1.5 h-6 bg-purple-600 rounded-full shrink-0"
                      />
                      <h2 className="text-2xl font-bold text-gray-800">{edu.degree}</h2>
                    </div>
                    <h3 className="text-xl text-purple-600 mb-4 ml-[18px]">{edu.institution}</h3>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.15 + 0.3 }}
                      className="flex flex-wrap gap-4 text-gray-600 mb-4"
                    >
                      <div className="flex items-center">
                        <Calendar size={18} className="mr-2" />
                        <span>{edu.period}</span>
                      </div>
                      {edu.location && (
                        <div className="flex items-center">
                          <MapPin size={18} className="mr-2" />
                          <span>{edu.location}</span>
                        </div>
                      )}
                    </motion.div>

                    {edu.description && <p className="text-gray-600 mb-4">{edu.description}</p>}
                    {achievements.length > 0 && (
                      <div className="space-y-2 mb-2">
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {achievements.map((achievement, i) => (
                            <li key={i}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Education;
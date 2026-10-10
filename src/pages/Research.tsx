import { motion } from 'framer-motion';
import { FileText, Github, Users, ExternalLink } from 'lucide-react';
import { usePortfolio } from '../hooks/usePortfolio';
import { nonEmpty, parseYouTubeId, youTubeEmbedUrl } from '../utils/portfolio';

// Stagger container for feature cards
const featureContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

const featureItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const linkHover = { x: 3 };

const Research = () => {
  const researchWorks = usePortfolio().data.research;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto mb-12">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-title"
      >
        Research Work
      </motion.h1>

      <div className="grid grid-cols-1 gap-8">
        {researchWorks.map((work, index) => {
          const videoId = parseYouTubeId(work.youtubeLink);
          const features = nonEmpty(work.features);
          return (
            <motion.div
              key={work.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.12, duration: 0.4, ease: 'easeOut' }}
              whileHover={{ y: -4, boxShadow: '0 20px 30px -12px rgba(0,0,0,0.15)' }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                {/* Accent bar + Title */}
                <div className="flex items-start gap-3 mb-3">
                  <motion.span
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: index * 0.12 + 0.2, duration: 0.4 }}
                    style={{ originY: 0 }}
                    className="w-1.5 h-6 bg-purple-600 rounded-full shrink-0 mt-1"
                  />
                  <h3 className="text-xl font-bold text-purple-600">
                    <span className="font-bold text-gray-600">Title: </span>
                    {work.title}
                  </h3>
                </div>

                {/* Author */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.12 + 0.25 }}
                  className="text-gray-600 mb-2 flex items-start gap-2"
                >
                  <Users size={16} className="mt-1 text-gray-400 shrink-0" />
                  <span>
                    <strong>Authors: </strong>
                    <span className="text-gray-800">{work.authors}</span>
                  </span>
                </motion.p>

                {/* Supervisor */}
                {work.supervisor && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.12 + 0.3 }}
                    className="text-gray-600 mb-4"
                  >
                    <strong>Supervisor: </strong>
                    {work.supervisorProfile ? (
                      <motion.a
                        whileHover={linkHover}
                        className="inline-block text-gray-800 hover:text-purple-600 transition-colors"
                        href={work.supervisorProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {work.supervisor}
                      </motion.a>
                    ) : (
                      <span className="text-gray-800">{work.supervisor}</span>
                    )}
                  </motion.p>
                )}

                {/* YouTube Video (iframe) */}
                {videoId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.12 + 0.35 }}
                    className="mb-6"
                  >
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Watch the Video</h4>
                    <iframe
                      width="100%"
                      height="315"
                      src={youTubeEmbedUrl(videoId)}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </motion.div>
                )}

                {/* Links row */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
                  {work.paperLink && (
                    <motion.a
                      whileHover={{ ...linkHover, color: '#7e22ce' }}
                      href={work.paperLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-purple-600 transition-colors"
                    >
                      <FileText size={20} />
                      <span>View Publication</span>
                      <ExternalLink size={14} className="opacity-60" />
                    </motion.a>
                  )}

                  {work.githubLink && (
                    <motion.a
                      whileHover={{ ...linkHover, color: '#7e22ce' }}
                      href={work.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-purple-600 transition-colors"
                    >
                      <Github size={20} />
                      <span>View on GitHub</span>
                      <ExternalLink size={14} className="opacity-60" />
                    </motion.a>
                  )}

                  {work.kaggleLink && (
                    <motion.a
                      whileHover={{ ...linkHover, color: '#7e22ce' }}
                      href={work.kaggleLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-purple-600 transition-colors"
                    >
                      <FileText size={20} />
                      <span>View on Kaggle</span>
                      <ExternalLink size={14} className="opacity-60" />
                    </motion.a>
                  )}
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <div className="text-gray-600 mb-2">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Features</h4>
                    <motion.div
                      variants={featureContainerVariants}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.4 }}
                      className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-8"
                    >
                      {features.map((feature, idx) => (
                        <motion.div
                          key={idx}
                          variants={featureItemVariants}
                          whileHover={{ scale: 1.01, backgroundColor: '#f3f0ff' }}
                          className="bg-gray-100 rounded-lg p-4 transition-colors"
                        >
                          <h5 className="text-md font-bold text-purple-600 mb-2">{feature}</h5>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Research;
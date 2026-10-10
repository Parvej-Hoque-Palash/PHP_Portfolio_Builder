import { motion } from 'framer-motion';
import { Code2 } from 'lucide-react';

const research_interest = [
  {
    title: 'Blockchain',
    description: '',
    icon: Code2,
    color: 'bg-blue-500'
  }
];

const ResearchInterest = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto mb-4"
    >
      <h1 className="page-title">Research Interest & Expertise</h1>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-8">
        {research_interest.map((research_interest, index) => (
          <motion.div
            key={research_interest.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
          >
            <div className={`${research_interest.color} w-14 h-14 rounded-lg flex items-center justify-center text-white mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
              <research_interest.icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">{research_interest.title}</h3>
            <p className="text-gray-600">{research_interest.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ResearchInterest;

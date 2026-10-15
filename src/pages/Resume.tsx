import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Navigate } from "react-router-dom";
import { usePortfolio } from '../hooks/usePortfolio';
import { driveDownloadUrl } from '../utils/portfolio';


const Resume = () => {
  // The resume is the PDF uploaded via the dashboard (stored in the owner's Drive).
  const { data, basePath } = usePortfolio();
  const driveResume = data.header.resume;

  if (!driveResume) return <Navigate to={basePath || "/"} replace />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto mb-4"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="page-title mb-0">Resume</h1>
        <a
          href={driveDownloadUrl(driveResume)}
          download
          className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Download size={20} />
          <span>Download PDF</span>
        </a>
      </div>

      {/* Drive files can't be fetched by pdf.js (no CORS), so use Drive's own viewer. */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: "80vh" }}>
        <iframe src={driveResume.url} title="Resume" className="w-full h-full" />
      </div>
    </motion.div>
  );
};

export default Resume;

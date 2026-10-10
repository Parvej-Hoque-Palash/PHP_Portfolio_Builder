import { motion } from 'framer-motion';
import { ImagePlus, User } from 'lucide-react';
import type { PortfolioHeader } from '../../types/portfolio';
import FileUploadButton from './FileUploadButton';

interface HeaderEditorProps {
  header: PortfolioHeader;
  onChange: (patch: Partial<PortfolioHeader>) => void;
}

const HeaderEditor = ({ header, onChange }: HeaderEditorProps) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="dash-card"
  >
    <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Header</h2>

    <div className="flex flex-col md:flex-row gap-8">
      {/* Profile photo */}
      <div className="flex flex-col items-center gap-3 md:w-48 shrink-0">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-purple-50 ring-4 ring-purple-100 flex items-center justify-center">
          {header.profilePhoto ? (
            <img src={header.profilePhoto.url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-purple-300" />
          )}
        </div>
        <FileUploadButton
          accept="image/*"
          label={header.profilePhoto ? 'Change photo' : 'Upload photo'}
          icon={<ImagePlus size={18} />}
          onUploaded={(profilePhoto) => onChange({ profilePhoto })}
        />
        {header.profilePhoto && (
          <button
            type="button"
            onClick={() => onChange({ profilePhoto: null })}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Remove photo
          </button>
        )}
      </div>

      {/* Name, designation */}
      <div className="flex-1 space-y-5">
        <div>
          <label htmlFor="fullName" className="dash-label">Full Name</label>
          <input
            id="fullName"
            className="dash-input"
            value={header.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="e.g. Md. Parvej Hoque Palash"
          />
        </div>
        <div>
          <label htmlFor="designation" className="dash-label">Designation</label>
          <input
            id="designation"
            className="dash-input"
            value={header.designation}
            onChange={(e) => onChange({ designation: e.target.value })}
            placeholder="e.g. Data & AI Researcher"
          />
        </div>
      </div>
    </div>
  </motion.section>
);

export default HeaderEditor;

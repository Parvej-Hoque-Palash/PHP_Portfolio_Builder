import { ExternalLink, FileText, Trash2 } from 'lucide-react';
import type { MediaRef } from '../../types/portfolio';
import EditorCard from './fields/EditorCard';
import FileUploadButton from './FileUploadButton';

interface ResumeEditorProps {
  resume: MediaRef | null;
  /** The default portfolio falls back to the PDF bundled with the site. */
  isDefault: boolean;
  onChange: (resume: MediaRef | null) => void;
}

const ResumeEditor = ({ resume, isDefault, onChange }: ResumeEditorProps) => (
  <EditorCard
    title="Resume"
    description="Upload your resume as a PDF. Visitors can view it on the Resume page and download it."
  >
    {resume ? (
      <>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <FileText size={20} className="text-purple-600 shrink-0" />
          <span className="flex-1 min-w-0 truncate text-gray-700">{resume.name}</span>
          <a href={resume.url} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Open resume">
            <ExternalLink size={18} />
          </a>
          <FileUploadButton accept="application/pdf" label="Replace" onUploaded={onChange} />
          <button type="button" onClick={() => onChange(null)} className="btn-icon hover:text-red-600" title="Remove resume">
            <Trash2 size={18} />
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200" style={{ height: '70vh' }}>
          <iframe src={resume.url} title="Resume preview" className="h-full w-full" />
        </div>
      </>
    ) : (
      <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-gray-200 px-4 py-10 text-center">
        <FileText size={40} className="text-purple-300" />
        <p className="text-gray-600">
          {isDefault
            ? 'No resume uploaded. The PDF bundled with the site is shown until you upload one.'
            : 'No resume uploaded yet. The Resume page appears in your menu once you add one.'}
        </p>
        <FileUploadButton accept="application/pdf" label="Upload resume (PDF)" icon={<FileText size={18} />} variant="primary" onUploaded={onChange} />
      </div>
    )}
  </EditorCard>
);

export default ResumeEditor;

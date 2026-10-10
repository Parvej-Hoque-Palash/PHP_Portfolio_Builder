import { ExternalLink, FileText, Trash2 } from 'lucide-react';
import type { MediaBlock } from '../../../types/portfolio';
import { isImage } from '../../../utils/portfolio';
import FileUploadButton from '../FileUploadButton';

interface MediaBlockEditorProps {
  block: MediaBlock;
  onChange: (block: MediaBlock) => void;
}

const MediaBlockEditor = ({ block, onChange }: MediaBlockEditorProps) => {
  const { media } = block;

  if (!media) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-purple-200 bg-purple-50/40 px-6 py-10 text-center">
        <p className="text-sm text-gray-600">Upload an image or PDF. It will be stored in your Google Drive and shared via link.</p>
        <FileUploadButton
          accept="image/*,application/pdf"
          label="Choose file"
          variant="primary"
          onUploaded={(m) => onChange({ ...block, media: m })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {isImage(media) ? (
          <img src={media.url} alt={block.caption || media.name} className="mx-auto max-h-96 object-contain" />
        ) : (
          <iframe src={media.url} title={media.name} className="h-96 w-full" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <FileText size={16} className="text-purple-600" />
        <span className="flex-1 min-w-0 truncate text-gray-600">{media.name}</span>
        <a href={media.url} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Open in new tab">
          <ExternalLink size={16} />
        </a>
        <FileUploadButton
          accept="image/*,application/pdf"
          label="Replace"
          onUploaded={(m) => onChange({ ...block, media: m })}
        />
        <button
          type="button"
          onClick={() => onChange({ ...block, media: null })}
          className="btn-icon hover:text-red-600"
          title="Remove file"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <input
        className="dash-input"
        value={block.caption}
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        placeholder="Caption (optional)"
      />
    </div>
  );
};

export default MediaBlockEditor;

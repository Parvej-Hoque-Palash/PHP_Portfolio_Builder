import { Youtube } from 'lucide-react';
import type { EmbedBlock } from '../../../types/portfolio';
import { parseYouTubeId, youTubeEmbedUrl } from '../../../utils/portfolio';

interface EmbedBlockEditorProps {
  block: EmbedBlock;
  onChange: (block: EmbedBlock) => void;
}

const EmbedBlockEditor = ({ block, onChange }: EmbedBlockEditorProps) => {
  const videoId = parseYouTubeId(block.url);
  const showError = block.url.trim() !== '' && !videoId;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Youtube size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
        <input
          className={`dash-input pl-10 ${showError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
          value={block.url}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
          placeholder="Paste a YouTube link, e.g. https://youtu.be/…"
        />
      </div>
      {showError && <p className="text-sm text-red-600">That doesn't look like a YouTube video link.</p>}

      {videoId && (
        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            src={youTubeEmbedUrl(videoId)}
            title="YouTube video"
            className="h-full w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
};

export default EmbedBlockEditor;

import { Download, ExternalLink } from 'lucide-react';
import type { Block } from '../../types/portfolio';
import { driveDownloadUrl, isImage, parseYouTubeId, youTubeEmbedUrl } from '../../utils/portfolio';

const BlockRenderer = ({ block }: { block: Block }) => {
  switch (block.type) {
    case 'text':
      return <p className="text-gray-600 leading-relaxed whitespace-pre-line">{block.content}</p>;

    case 'list': {
      const items = block.items.filter((i) => i.trim());
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag className={`space-y-2 pl-6 text-gray-600 marker:text-purple-600 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
          {items.map((item, i) => (
            <li key={i} className="pl-1">{item}</li>
          ))}
        </ListTag>
      );
    }

    case 'media': {
      const { media } = block;
      if (!media) return null;
      return (
        <figure className="space-y-3">
          {isImage(media) ? (
            <img
              src={media.url}
              alt={block.caption || media.name}
              loading="lazy"
              className="mx-auto max-h-[32rem] rounded-lg object-contain shadow"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200" style={{ height: '70vh' }}>
              <iframe src={media.url} title={block.caption || media.name} className="h-full w-full" />
            </div>
          )}
          <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
            <span>{block.caption}</span>
            <span className="flex gap-3">
              <a href={media.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800">
                <ExternalLink size={14} /> Open
              </a>
              {!isImage(media) && (
                <a href={driveDownloadUrl(media)} className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800">
                  <Download size={14} /> Download
                </a>
              )}
            </span>
          </figcaption>
        </figure>
      );
    }

    case 'embed': {
      const videoId = parseYouTubeId(block.url);
      if (!videoId) return null;
      return (
        <div className="aspect-video overflow-hidden rounded-lg bg-black shadow">
          <iframe
            src={youTubeEmbedUrl(videoId)}
            title="YouTube video"
            className="h-full w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }
};

export default BlockRenderer;

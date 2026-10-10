import type { TextBlock } from '../../../types/portfolio';

interface TextBlockEditorProps {
  block: TextBlock;
  onChange: (block: TextBlock) => void;
}

const TextBlockEditor = ({ block, onChange }: TextBlockEditorProps) => (
  <textarea
    className="dash-input min-h-[120px] resize-y leading-relaxed"
    value={block.content}
    onChange={(e) => onChange({ ...block, content: e.target.value })}
    placeholder="Write a paragraph…"
  />
);

export default TextBlockEditor;

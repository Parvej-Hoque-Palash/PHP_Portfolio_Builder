import type { HomeContent } from '../../../types/portfolio';
import { newId } from '../../../utils/portfolio';
import ColorPicker from '../fields/ColorPicker';
import EditorCard from '../fields/EditorCard';
import IconPicker from '../fields/IconPicker';
import RepeatableList from '../fields/RepeatableList';
import TextField from '../fields/TextField';

interface HomeEditorProps {
  value: HomeContent;
  onChange: (value: HomeContent) => void;
}

const HomeEditor = ({ value, onChange }: HomeEditorProps) => (
  <>
    <EditorCard title="Home Page" description="The welcome heading and tagline under your photo.">
      <TextField label="Heading" value={value.heading} onChange={(heading) => onChange({ ...value, heading })} />
      <TextField label="Tagline" value={value.tagline} onChange={(tagline) => onChange({ ...value, tagline })} />
    </EditorCard>

    <EditorCard title="Highlights" description="The grid of expertise cards on the home page.">
      <RepeatableList
        items={value.highlights}
        onChange={(highlights) => onChange({ ...value, highlights })}
        createItem={() => ({ id: newId(), title: '', icon: 'Star', color: 'bg-purple-600' })}
        itemTitle={(h) => h.title || 'Untitled highlight'}
        addLabel="Add highlight"
        renderItem={(h, update) => (
          <>
            <TextField label="Title" value={h.title} onChange={(title) => update({ title })} />
            <div className="flex flex-wrap gap-6">
              <IconPicker value={h.icon} onChange={(icon) => update({ icon })} />
              <ColorPicker value={h.color} onChange={(color) => update({ color })} />
            </div>
          </>
        )}
      />
    </EditorCard>
  </>
);

export default HomeEditor;

import type { SkillCategory } from '../../../types/portfolio';
import { newId } from '../../../utils/portfolio';
import ColorPicker from '../fields/ColorPicker';
import EditorCard from '../fields/EditorCard';
import IconPicker from '../fields/IconPicker';
import RepeatableList from '../fields/RepeatableList';
import TagInput from '../fields/TagInput';
import TextField from '../fields/TextField';

interface SkillsEditorProps {
  value: SkillCategory[];
  onChange: (value: SkillCategory[]) => void;
}

const SkillsEditor = ({ value, onChange }: SkillsEditorProps) => (
  <EditorCard title="Skills" description="Each category is a card of skill pills on the Skills page.">
    <RepeatableList
      items={value}
      onChange={onChange}
      createItem={() => ({ id: newId(), title: '', icon: 'Code2', color: 'bg-blue-600', skills: [] })}
      itemTitle={(c) => `${c.title || 'Untitled category'} (${c.skills.length})`}
      addLabel="Add category"
      renderItem={(c, update) => (
        <>
          <TextField label="Category" value={c.title} onChange={(title) => update({ title })} />
          <div className="flex flex-wrap gap-6">
            <IconPicker value={c.icon} onChange={(icon) => update({ icon })} />
            <ColorPicker value={c.color} onChange={(color) => update({ color })} />
          </div>
          <TagInput label="Skills" tags={c.skills} onChange={(skills) => update({ skills })} />
        </>
      )}
    />
  </EditorCard>
);

export default SkillsEditor;

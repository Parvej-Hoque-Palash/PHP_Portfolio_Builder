import type { ExperienceItem } from '../../../types/portfolio';
import { newId } from '../../../utils/portfolio';
import EditorCard from '../fields/EditorCard';
import RepeatableList from '../fields/RepeatableList';
import StringListEditor from '../fields/StringListEditor';
import TextField from '../fields/TextField';

interface ExperienceEditorProps {
  value: ExperienceItem[];
  onChange: (value: ExperienceItem[]) => void;
}

const ExperienceEditor = ({ value, onChange }: ExperienceEditorProps) => (
  <EditorCard title="Experience" description="Listed in this order on the Experience page.">
    <RepeatableList
      items={value}
      onChange={onChange}
      createItem={() => ({ id: newId(), organisation: '', role: '', period: '', summary: [''] })}
      itemTitle={(e) => [e.role, e.organisation].filter(Boolean).join(' · ') || 'New position'}
      addLabel="Add position"
      renderItem={(e, update) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Organisation" value={e.organisation} onChange={(organisation) => update({ organisation })} />
            <TextField label="Designation" value={e.role} onChange={(role) => update({ role })} />
          </div>
          <TextField label="Period" value={e.period} onChange={(period) => update({ period })} placeholder="e.g. April 2025 - Present" />
          <StringListEditor
            label="Summary"
            items={e.summary}
            onChange={(summary) => update({ summary })}
            multiline
            addLabel="Add bullet"
          />
        </>
      )}
    />
  </EditorCard>
);

export default ExperienceEditor;

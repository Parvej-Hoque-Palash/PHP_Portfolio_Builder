import type { EducationItem } from '../../../types/portfolio';
import { newId } from '../../../utils/portfolio';
import EditorCard from '../fields/EditorCard';
import RepeatableList from '../fields/RepeatableList';
import StringListEditor from '../fields/StringListEditor';
import TextField from '../fields/TextField';

interface EducationEditorProps {
  value: EducationItem[];
  onChange: (value: EducationItem[]) => void;
}

const EducationEditor = ({ value, onChange }: EducationEditorProps) => (
  <EditorCard title="Education" description="Shown as a timeline in this order.">
    <RepeatableList
      items={value}
      onChange={onChange}
      createItem={() => ({ id: newId(), degree: '', institution: '', location: '', period: '', description: '', achievements: [] })}
      itemTitle={(e) => e.degree || 'New degree'}
      addLabel="Add education"
      renderItem={(e, update) => (
        <>
          <TextField label="Degree" value={e.degree} onChange={(degree) => update({ degree })} />
          <TextField label="Institution" value={e.institution} onChange={(institution) => update({ institution })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Location" value={e.location} onChange={(location) => update({ location })} />
            <TextField label="Period" value={e.period} onChange={(period) => update({ period })} placeholder="e.g. 2019 - 2024" />
          </div>
          <TextField label="Description" value={e.description} onChange={(description) => update({ description })} multiline />
          <StringListEditor
            label="Achievements"
            items={e.achievements}
            onChange={(achievements) => update({ achievements })}
            addLabel="Add achievement"
          />
        </>
      )}
    />
  </EditorCard>
);

export default EducationEditor;

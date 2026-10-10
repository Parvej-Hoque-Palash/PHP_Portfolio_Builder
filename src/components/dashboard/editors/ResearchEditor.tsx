import type { ResearchWork } from '../../../types/portfolio';
import { newId } from '../../../utils/portfolio';
import EditorCard from '../fields/EditorCard';
import RepeatableList from '../fields/RepeatableList';
import StringListEditor from '../fields/StringListEditor';
import TextField from '../fields/TextField';

interface ResearchEditorProps {
  value: ResearchWork[];
  onChange: (value: ResearchWork[]) => void;
}

const createWork = (): ResearchWork => ({
  id: newId(),
  title: '',
  authors: '',
  supervisor: '',
  supervisorProfile: '',
  youtubeLink: '',
  kaggleLink: '',
  githubLink: '',
  paperLink: '',
  features: [],
});

const ResearchEditor = ({ value, onChange }: ResearchEditorProps) => (
  <EditorCard title="Research Work" description="Empty links are hidden on the public page.">
    <RepeatableList
      items={value}
      onChange={onChange}
      createItem={createWork}
      itemTitle={(w) => w.title || 'Untitled research'}
      addLabel="Add research"
      renderItem={(w, update) => (
        <>
          <TextField label="Title" value={w.title} onChange={(title) => update({ title })} multiline rows={2} />
          <TextField label="Authors" value={w.authors} onChange={(authors) => update({ authors })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Supervisor" value={w.supervisor} onChange={(supervisor) => update({ supervisor })} />
            <TextField label="Supervisor profile URL" type="url" value={w.supervisorProfile} onChange={(supervisorProfile) => update({ supervisorProfile })} />
            <TextField label="Publication URL" type="url" value={w.paperLink} onChange={(paperLink) => update({ paperLink })} />
            <TextField label="GitHub URL" type="url" value={w.githubLink} onChange={(githubLink) => update({ githubLink })} />
            <TextField label="Kaggle URL" type="url" value={w.kaggleLink} onChange={(kaggleLink) => update({ kaggleLink })} />
            <TextField label="YouTube video URL" type="url" value={w.youtubeLink} onChange={(youtubeLink) => update({ youtubeLink })} />
          </div>
          <StringListEditor label="Features" items={w.features} onChange={(features) => update({ features })} addLabel="Add feature" />
        </>
      )}
    />
  </EditorCard>
);

export default ResearchEditor;

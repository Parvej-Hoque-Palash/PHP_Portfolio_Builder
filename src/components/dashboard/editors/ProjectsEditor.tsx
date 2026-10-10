import type { Project } from '../../../types/portfolio';
import { newId } from '../../../utils/portfolio';
import EditorCard from '../fields/EditorCard';
import RepeatableList from '../fields/RepeatableList';
import TextField from '../fields/TextField';

interface ProjectsEditorProps {
  value: Project[];
  onChange: (value: Project[]) => void;
}

const ProjectsEditor = ({ value, onChange }: ProjectsEditorProps) => (
  <EditorCard title="Projects" description="The live link is also shown as a preview on the Projects page.">
    <RepeatableList
      items={value}
      onChange={onChange}
      createItem={() => ({ id: newId(), name: '', description: '', link: '', github: '' })}
      itemTitle={(p) => p.name || 'Untitled project'}
      addLabel="Add project"
      renderItem={(p, update) => (
        <>
          <TextField label="Name" value={p.name} onChange={(name) => update({ name })} />
          <TextField label="Description" value={p.description} onChange={(description) => update({ description })} multiline />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Live URL" type="url" value={p.link} onChange={(link) => update({ link })} placeholder="https://" />
            <TextField label="GitHub URL" type="url" value={p.github} onChange={(github) => update({ github })} placeholder="https://github.com/…" />
          </div>
        </>
      )}
    />
  </EditorCard>
);

export default ProjectsEditor;

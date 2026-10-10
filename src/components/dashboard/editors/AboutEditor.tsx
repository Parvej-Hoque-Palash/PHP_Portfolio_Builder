import type { AboutContent } from '../../../types/portfolio';
import { newId } from '../../../utils/portfolio';
import EditorCard from '../fields/EditorCard';
import IconPicker from '../fields/IconPicker';
import RepeatableList from '../fields/RepeatableList';
import StringListEditor from '../fields/StringListEditor';
import TagInput from '../fields/TagInput';
import TextField from '../fields/TextField';

interface AboutEditorProps {
  value: AboutContent;
  onChange: (value: AboutContent) => void;
}

const BOLD_HINT = 'Wrap text in **double asterisks** to make it bold.';

const AboutEditor = ({ value, onChange }: AboutEditorProps) => {
  const set = <K extends keyof AboutContent>(key: K, v: AboutContent[K]) => onChange({ ...value, [key]: v });

  return (
    <>
      <EditorCard title="General Information" description="The labelled facts next to your photo.">
        <RepeatableList
          items={value.info}
          onChange={(info) => set('info', info)}
          createItem={() => ({ id: newId(), label: '', value: '', icon: 'User' })}
          itemTitle={(item) => (item.label ? `${item.label}: ${item.value}` : 'New item')}
          addLabel="Add info row"
          renderItem={(item, update) => (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Label" value={item.label} onChange={(label) => update({ label })} placeholder="e.g. Nationality" />
                <TextField label="Value" value={item.value} onChange={(v) => update({ value: v })} />
              </div>
              <IconPicker value={item.icon} onChange={(icon) => update({ icon })} />
            </>
          )}
        />
      </EditorCard>

      <EditorCard title="About Me" description="Shown in the About Me card. Everything after the intro is revealed by “See more”.">
        <StringListEditor
          label="Intro paragraphs (always visible)"
          hint={BOLD_HINT}
          items={value.intro}
          onChange={(intro) => set('intro', intro)}
          multiline
          addLabel="Add paragraph"
        />
        <StringListEditor
          label="More paragraphs (after “See more”)"
          hint={BOLD_HINT}
          items={value.more}
          onChange={(more) => set('more', more)}
          multiline
          addLabel="Add paragraph"
        />
      </EditorCard>

      <EditorCard title="Ventures" description="Startup / side-project cards inside the expanded About Me text.">
        <RepeatableList
          items={value.ventures}
          onChange={(ventures) => set('ventures', ventures)}
          createItem={() => ({ id: newId(), title: '', description: '', icon: 'Rocket' })}
          itemTitle={(v) => v.title || 'Untitled venture'}
          addLabel="Add venture"
          renderItem={(v, update) => (
            <>
              <TextField label="Title" value={v.title} onChange={(title) => update({ title })} />
              <TextField label="Description" value={v.description} onChange={(description) => update({ description })} multiline />
              <IconPicker value={v.icon} onChange={(icon) => update({ icon })} />
            </>
          )}
        />
      </EditorCard>

      <EditorCard title="Passions & Closing">
        <TextField label="Passions intro" value={value.passionsIntro} onChange={(v) => set('passionsIntro', v)} multiline hint={BOLD_HINT} />
        <TagInput label="Passions" tags={value.passions} onChange={(passions) => set('passions', passions)} />
        <TextField label="Closing paragraph" value={value.closing} onChange={(v) => set('closing', v)} multiline rows={4} hint={BOLD_HINT} />
      </EditorCard>
    </>
  );
};

export default AboutEditor;

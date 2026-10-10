import type { ContactContent } from '../../../types/portfolio';
import { newId } from '../../../utils/portfolio';
import EditorCard from '../fields/EditorCard';
import IconPicker from '../fields/IconPicker';
import RepeatableList from '../fields/RepeatableList';
import TextField from '../fields/TextField';

interface ContactEditorProps {
  value: ContactContent;
  onChange: (value: ContactContent) => void;
}

const ContactEditor = ({ value, onChange }: ContactEditorProps) => (
  <>
    <EditorCard title="Get in Touch" description="Leave a field empty to hide it.">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Phone" type="tel" value={value.phone} onChange={(phone) => onChange({ ...value, phone })} />
        <TextField label="Email" type="email" value={value.email} onChange={(email) => onChange({ ...value, email })} />
      </div>
      <TextField label="Location" value={value.location} onChange={(location) => onChange({ ...value, location })} />
    </EditorCard>

    <EditorCard title="Contact Form" description="Messages are delivered by Formspree to the email on your Formspree account.">
      <TextField
        label="Formspree form ID"
        value={value.formspreeId}
        onChange={(formspreeId) => onChange({ ...value, formspreeId: formspreeId.trim() })}
        placeholder="e.g. xyzabcde"
        hint="The last part of your form's endpoint (formspree.io/f/<id>). Leave empty to hide the form."
      />
    </EditorCard>

    <EditorCard title="Follow Me" description="Social profile buttons on the Contact page.">
      <RepeatableList
        items={value.socials}
        onChange={(socials) => onChange({ ...value, socials })}
        createItem={() => ({ id: newId(), label: '', url: '', icon: 'Link' })}
        itemTitle={(s) => s.label || 'New link'}
        addLabel="Add social link"
        renderItem={(s, update) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Label" value={s.label} onChange={(label) => update({ label })} placeholder="e.g. LinkedIn" />
              <TextField label="URL" type="url" value={s.url} onChange={(url) => update({ url })} placeholder="https://" />
            </div>
            <IconPicker value={s.icon} onChange={(icon) => update({ icon })} />
          </>
        )}
      />
    </EditorCard>
  </>
);

export default ContactEditor;

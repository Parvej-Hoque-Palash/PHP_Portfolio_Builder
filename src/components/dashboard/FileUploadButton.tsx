import { useRef, useState, type ReactNode } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { uploadFile } from '../../services/driveService';
import type { MediaRef } from '../../types/portfolio';
import { toMediaRef } from '../../utils/portfolio';

const MAX_SIZE_MB = 25;

interface FileUploadButtonProps {
  /** Value for the file input's accept attribute, e.g. "image/*" or "application/pdf". */
  accept: string;
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
  onUploaded: (media: MediaRef) => void;
}

const FileUploadButton = ({ accept, label, icon, variant = 'secondary', onUploaded }: FileUploadButtonProps) => {
  const { accessToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (!accessToken) {
      setError('Sign in again to upload files.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is larger than ${MAX_SIZE_MB} MB.`);
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await uploadFile(accessToken, file);
      onUploaded(toMediaRef(uploaded));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
      >
        {isUploading ? <Loader2 size={18} className="animate-spin" /> : icon ?? <Upload size={18} />}
        {isUploading ? 'Uploading…' : label}
      </button>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FileUploadButton;

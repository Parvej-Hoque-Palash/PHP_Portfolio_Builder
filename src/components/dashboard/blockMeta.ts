import { AlignLeft, List, Paperclip, Youtube, type LucideIcon } from 'lucide-react';
import type { BlockType } from '../../types/portfolio';

export const BLOCK_META: Record<BlockType, { label: string; icon: LucideIcon }> = {
  text: { label: 'Text', icon: AlignLeft },
  list: { label: 'List', icon: List },
  media: { label: 'Media', icon: Paperclip },
  embed: { label: 'YouTube', icon: Youtube },
};

export const BLOCK_TYPES = Object.keys(BLOCK_META) as BlockType[];

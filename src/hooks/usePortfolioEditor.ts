import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { publishPortfolioToDrive, readPortfolioConfig } from '../services/driveService';
import type { Block, BlockType, ContentKey, LayoutItem, PortfolioContent, PortfolioData, PortfolioHeader } from '../types/portfolio';
import { sectionLayoutId } from '../utils/layout';
import { createBlock, createSection, normalizePortfolio } from '../utils/portfolio';

type Action =
  | { type: 'reset'; data: PortfolioData }
  | { type: 'updateHeader'; patch: Partial<PortfolioHeader> }
  | { type: 'setContent'; key: ContentKey; value: PortfolioContent[ContentKey] }
  | { type: 'addSection'; title: string }
  | { type: 'renameSection'; sectionId: string; title: string }
  | { type: 'removeSection'; sectionId: string }
  | { type: 'setLayout'; layout: LayoutItem[] }
  | { type: 'setVisible'; layoutId: string; visible: boolean }
  | { type: 'addBlock'; sectionId: string; blockType: BlockType }
  | { type: 'updateBlock'; sectionId: string; block: Block }
  | { type: 'removeBlock'; sectionId: string; blockId: string }
  | { type: 'moveBlock'; sectionId: string; blockId: string; delta: -1 | 1 };

function move<T extends { id: string }>(items: T[], id: string, delta: -1 | 1): T[] {
  const from = items.findIndex((i) => i.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= items.length) return items;
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

function reducer(state: PortfolioData, action: Action): PortfolioData {
  const mapSection = (sectionId: string, fn: (s: PortfolioData['sections'][number]) => typeof s) => ({
    ...state,
    sections: state.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
  });

  switch (action.type) {
    case 'reset':
      return action.data;
    case 'updateHeader':
      return { ...state, header: { ...state.header, ...action.patch } };
    case 'setContent':
      return { ...state, [action.key]: action.value };
    case 'addSection': {
      const section = createSection(action.title);
      return {
        ...state,
        sections: [...state.sections, section],
        layout: [...state.layout, { id: sectionLayoutId(section.id), visible: true }],
      };
    }
    case 'renameSection':
      return mapSection(action.sectionId, (s) => ({ ...s, title: action.title }));
    case 'removeSection':
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.sectionId),
        layout: state.layout.filter((item) => item.id !== sectionLayoutId(action.sectionId)),
      };
    case 'setLayout':
      return { ...state, layout: action.layout };
    case 'setVisible':
      return {
        ...state,
        layout: state.layout.map((item) => (item.id === action.layoutId ? { ...item, visible: action.visible } : item)),
      };
    case 'addBlock':
      return mapSection(action.sectionId, (s) => ({ ...s, blocks: [...s.blocks, createBlock(action.blockType)] }));
    case 'updateBlock':
      return mapSection(action.sectionId, (s) => ({
        ...s,
        blocks: s.blocks.map((b) => (b.id === action.block.id ? action.block : b)),
      }));
    case 'removeBlock':
      return mapSection(action.sectionId, (s) => ({
        ...s,
        blocks: s.blocks.filter((b) => b.id !== action.blockId),
      }));
    case 'moveBlock':
      return mapSection(action.sectionId, (s) => ({ ...s, blocks: move(s.blocks, action.blockId, action.delta) }));
  }
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PortfolioEditorActions {
  updateHeader: (patch: Partial<PortfolioHeader>) => void;
  setContent: <K extends ContentKey>(key: K, value: PortfolioContent[K]) => void;
  addSection: (title: string) => void;
  renameSection: (sectionId: string, title: string) => void;
  removeSection: (sectionId: string) => void;
  /** Replace the nav order (e.g. after a drag). */
  setLayout: (layout: LayoutItem[]) => void;
  setVisible: (layoutId: string, visible: boolean) => void;
  addBlock: (sectionId: string, blockType: BlockType) => void;
  updateBlock: (sectionId: string, block: Block) => void;
  removeBlock: (sectionId: string, blockId: string) => void;
  moveBlock: (sectionId: string, blockId: string, delta: -1 | 1) => void;
}

/**
 * Local editing state for portfolio_config.json. Loads once per signed-in account,
 * tracks unsaved changes, and writes back to Drive on save().
 */
export interface PortfolioEditorOptions {
  /** Starting content for an account without a saved config, and the base for filling gaps. */
  createInitial: () => PortfolioData;
  onSaved?: (data: PortfolioData, configFileId: string) => void;
}

export function usePortfolioEditor(
  accessToken: string | null,
  userId: string | null,
  { createInitial, onSaved }: PortfolioEditorOptions,
) {
  // Read through a ref so a new function identity each render doesn't retrigger loading.
  const createInitialRef = useRef(createInitial);
  createInitialRef.current = createInitial;

  const [data, dispatch] = useReducer(reducer, undefined, createInitial);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => JSON.stringify(createInitial()));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [configFileId, setConfigFileId] = useState<string | null>(null);
  const loadedForUser = useRef<string | null>(null);

  const isDirty = useMemo(() => JSON.stringify(data) !== savedSnapshot, [data, savedSnapshot]);

  // Load when an account signs in (or a different account replaces it).
  // A token refresh for the same account keeps any unsaved local edits.
  useEffect(() => {
    if (!accessToken || !userId) return;
    if (loadedForUser.current === userId) return;

    let cancelled = false;
    setStatus('loading');
    setLoadError(null);
    readPortfolioConfig(accessToken)
      .then((stored) => {
        if (cancelled) return;
        // No config yet: start from the initial template, marked unsaved so the first Save publishes it.
        const initial = createInitialRef.current();
        const next = stored ? normalizePortfolio(stored.config, initial) : initial;
        setConfigFileId(stored?.fileId ?? null);
        dispatch({ type: 'reset', data: next });
        setSavedSnapshot(stored ? JSON.stringify(next) : '');
        loadedForUser.current = userId;
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load portfolio data');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, userId, reloadKey]);

  const reload = useCallback(() => {
    loadedForUser.current = null;
    setReloadKey((k) => k + 1);
  }, []);

  const save = useCallback(async () => {
    if (!accessToken) {
      setSaveError('Your session has expired. Sign in again to save.');
      return;
    }
    const snapshot = JSON.stringify(data);
    setIsSaving(true);
    setSaveError(null);
    try {
      const { fileId } = await publishPortfolioToDrive(data, accessToken);
      setConfigFileId(fileId);
      setSavedSnapshot(snapshot);
      setLastSavedAt(new Date());
      onSaved?.(data, fileId);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, data, onSaved]);

  /** Forget everything loaded (e.g. on explicit sign-out). */
  const clear = useCallback(() => {
    loadedForUser.current = null;
    const initial = createInitialRef.current();
    dispatch({ type: 'reset', data: initial });
    setSavedSnapshot(JSON.stringify(initial));
    setConfigFileId(null);
    setLastSavedAt(null);
    setSaveError(null);
    setStatus('idle');
  }, []);

  const discard = useCallback(() => {
    const restored = savedSnapshot ? (JSON.parse(savedSnapshot) as PortfolioData) : createInitialRef.current();
    dispatch({ type: 'reset', data: restored });
  }, [savedSnapshot]);

  const actions = useMemo<PortfolioEditorActions>(
    () => ({
      updateHeader: (patch) => dispatch({ type: 'updateHeader', patch }),
      setContent: (key, value) => dispatch({ type: 'setContent', key, value }),
      addSection: (title) => dispatch({ type: 'addSection', title }),
      renameSection: (sectionId, title) => dispatch({ type: 'renameSection', sectionId, title }),
      removeSection: (sectionId) => dispatch({ type: 'removeSection', sectionId }),
      setLayout: (layout) => dispatch({ type: 'setLayout', layout }),
      setVisible: (layoutId, visible) => dispatch({ type: 'setVisible', layoutId, visible }),
      addBlock: (sectionId, blockType) => dispatch({ type: 'addBlock', sectionId, blockType }),
      updateBlock: (sectionId, block) => dispatch({ type: 'updateBlock', sectionId, block }),
      removeBlock: (sectionId, blockId) => dispatch({ type: 'removeBlock', sectionId, blockId }),
      moveBlock: (sectionId, blockId, delta) => dispatch({ type: 'moveBlock', sectionId, blockId, delta }),
    }),
    [],
  );

  return { data, status, loadError, configFileId, reload, isDirty, isSaving, saveError, lastSavedAt, save, discard, clear, actions };
}

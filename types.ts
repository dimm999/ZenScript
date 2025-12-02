
export type FontFamily = 'sans' | 'serif' | 'mono' | 'hand';

export interface Theme {
  id: string;
  name: string;
  colors: {
    bgMain: string;
    bgPaper: string;
    textMain: string;
    textMuted: string;
    cursor: string;
    selection: string;
    border: string;
  };
}

export interface EditorSettings {
  themeId: string;
  fontFamily: FontFamily;
  fontSize: number;
  isFocusMode: boolean;
  editorWidth: number;
  sidebarVisible: boolean;
}

// --- Block System ---

export type BlockType = 'text' | 'image';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface TextBlockData extends BaseBlock {
  type: 'text';
  content: string;
}

export interface ImageData {
  id: string;
  url: string;
  caption?: string;
  width?: number; // Percentage or px
}

export interface ImageBlockData extends BaseBlock {
  type: 'image';
  images: ImageData[]; // Array for grid support
  align: 'left' | 'center' | 'right';
  width: number; // Container width percentage
}

export type Block = TextBlockData | ImageBlockData;

// --- File System ---

export interface DocFile {
  id: string;
  parentId?: string; // For nested sub-documents
  title: string;
  blocks: Block[];
  lastModified: number;
  isOpened: boolean; // For tabs
}

export interface AppState {
  files: DocFile[];
  activeFileId: string | null;
}

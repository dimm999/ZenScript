
import { Theme, FontFamily, EditorSettings } from './types';

export const FONTS: Record<FontFamily, { name: string; value: string; cssClass: string }> = {
  sans: { name: 'Helvetica / Sans', value: 'sans', cssClass: 'font-sans' },
  serif: { name: 'Elegant Serif', value: 'serif', cssClass: 'font-serif' },
  mono: { name: 'Consolas / Mono', value: 'mono', cssClass: 'font-mono' },
  hand: { name: 'Handwritten', value: 'hand', cssClass: 'font-[cursive]' },
};

export const THEMES: Theme[] = [
  {
    id: 'zen-classic',
    name: 'Classic Zen',
    colors: {
      bgMain: '#ded9c5',
      bgPaper: '#ffffff',
      textMain: '#3b3221',
      textMuted: '#8a8475',
      cursor: '#3b3221',
      selection: '#e6e1d1',
      border: '#d4d0c0',
    },
  },
  {
    id: 'soda-light',
    name: 'Soda Light',
    colors: {
      bgMain: '#e6e6e6',
      bgPaper: '#ffffff',
      textMain: '#3c3c3c',
      textMuted: '#969696',
      cursor: '#f2777a',
      selection: '#d6e1ea',
      border: '#dcdcdc',
    },
  },
  {
    id: 'wonder-ink',
    name: 'Wonder Ink',
    colors: {
      bgMain: '#d0d8d2',
      bgPaper: '#f7f9f8',
      textMain: '#37474f',
      textMuted: '#90a4ae',
      cursor: '#26a69a',
      selection: '#cfd8dc',
      border: '#b0bec5',
    },
  },
  {
    id: 'writers-study',
    name: 'Writer\'s Study',
    colors: {
      bgMain: '#9eaab6',
      bgPaper: '#f5f7fa',
      textMain: '#2c3e50',
      textMuted: '#7f8c8d',
      cursor: '#34495e',
      selection: '#d5dbdb',
      border: '#cbd5e0',
    },
  },
  {
    id: 'midnight-ink',
    name: 'Midnight Ink',
    colors: {
      bgMain: '#0f172a',
      bgPaper: '#1e293b',
      textMain: '#e2e8f0',
      textMuted: '#64748b',
      cursor: '#38bdf8',
      selection: '#334155',
      border: '#334155',
    },
  },
  {
    id: 'forest-whisper',
    name: 'Forest Whisper',
    colors: {
      bgMain: '#2e3630',
      bgPaper: '#e6ede8',
      textMain: '#1a2920',
      textMuted: '#6b7d72',
      cursor: '#2d4a3e',
      selection: '#cce3d6',
      border: '#b0c4b9',
    },
  },
  {
    id: 'soft-sepia',
    name: 'Soft Sepia',
    colors: {
      bgMain: '#e8e0d5',
      bgPaper: '#fdfbf7',
      textMain: '#5c4b37',
      textMuted: '#a3927e',
      cursor: '#8c7356',
      selection: '#ede5da',
      border: '#dcd3c8',
    },
  },
];

export const DEFAULT_SETTINGS: EditorSettings = {
  themeId: 'zen-classic',
  fontFamily: 'sans' as FontFamily,
  fontSize: 18,
  isFocusMode: false,
  editorWidth: 900,
  sidebarVisible: true,
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

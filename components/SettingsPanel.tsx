import React from 'react';
import { EditorSettings, FontFamily } from '../types';
import { THEMES, FONTS } from '../constants';
import { Type, Palette, Monitor, LayoutTemplate, MoveHorizontal } from 'lucide-react';

interface SettingsPanelProps {
  settings: EditorSettings;
  onUpdate: (newSettings: Partial<EditorSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-16 right-6 z-50 w-72 rounded-2xl shadow-2xl backdrop-blur-xl border border-[var(--border)] animate-in fade-in slide-in-from-top-4 duration-300"
      style={{ backgroundColor: 'var(--bg-paper)', color: 'var(--text-main)' }}
    >
      <div className="p-5 space-y-6">
        
        {/* Typography Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium opacity-70">
            <Type size={16} />
            <span>Typography</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(FONTS) as FontFamily[]).map((fontKey) => (
              <button
                key={fontKey}
                onClick={() => onUpdate({ fontFamily: fontKey })}
                className={`
                  p-2 text-xs rounded-md border transition-all
                  ${settings.fontFamily === fontKey 
                    ? 'border-[var(--text-main)] bg-[var(--bg-main)]' 
                    : 'border-transparent hover:bg-[var(--bg-main)] opacity-60 hover:opacity-100'}
                `}
              >
                {FONTS[fontKey].name.split(' / ')[0]}
              </button>
            ))}
          </div>
          
          {/* Font Size */}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs opacity-60 w-8">Size</span>
            <input 
              type="range" 
              min="14" 
              max="32" 
              step="1"
              value={settings.fontSize}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--text-main)]"
            />
            <span className="text-xs w-6 text-right">{settings.fontSize}</span>
          </div>

          {/* Editor Width */}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs opacity-60 w-8">Width</span>
            <input 
              type="range" 
              min="600" 
              max="1400" 
              step="50"
              value={settings.editorWidth || 900} 
              onChange={(e) => onUpdate({ editorWidth: parseInt(e.target.value) })}
              className="w-full h-1 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--text-main)]"
            />
            <span className="text-xs w-6 text-right opacity-60">
               {settings.editorWidth >= 1400 ? 'Max' : 'Px'}
            </span>
          </div>
        </div>

        <div className="h-px bg-[var(--border)] w-full opacity-50" />

        {/* Theme Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium opacity-70">
            <Palette size={16} />
            <span>Theme</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onUpdate({ themeId: theme.id })}
                className={`
                  flex items-center gap-2 p-2 rounded-lg text-left transition-all
                  ${settings.themeId === theme.id ? 'ring-1 ring-[var(--text-main)] ring-offset-1 ring-offset-[var(--bg-paper)]' : 'hover:opacity-80'}
                `}
                style={{ backgroundColor: theme.colors.bgMain }}
              >
                <div 
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm" 
                  style={{ backgroundColor: theme.colors.bgPaper }} 
                />
                <span 
                  className="text-xs font-medium truncate"
                  style={{ color: theme.colors.textMain }}
                >
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[var(--border)] w-full opacity-50" />

        {/* Interface Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium opacity-70">
            <LayoutTemplate size={16} />
            <span>Interface</span>
          </div>
          <button
            onClick={() => onUpdate({ isFocusMode: !settings.isFocusMode })}
            className="flex items-center justify-between w-full p-2 rounded-md hover:bg-[var(--bg-main)] transition-colors group"
          >
            <span className="text-sm">Zen Focus Mode</span>
            <div className={`
              w-10 h-5 rounded-full relative transition-colors duration-300
              ${settings.isFocusMode ? 'bg-[var(--text-main)]' : 'bg-[var(--border)]'}
            `}>
              <div className={`
                absolute top-1 w-3 h-3 rounded-full bg-[var(--bg-paper)] transition-all duration-300 shadow-sm
                ${settings.isFocusMode ? 'left-6' : 'left-1'}
              `} />
            </div>
          </button>
          <p className="text-[10px] opacity-50 px-2">
            Hides the toolbar while you are typing for an distraction-free experience.
          </p>
        </div>

      </div>
    </div>
  );
};
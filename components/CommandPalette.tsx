
import React, { useState, useEffect, useRef } from 'react';
import { DocFile } from '../types';
import { Search, FileText } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: DocFile[];
  onSelect: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, files, onSelect }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = files.filter(f => 
    (f.title || 'Untitled').toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredFiles.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredFiles.length) % filteredFiles.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          onSelect(filteredFiles[selectedIndex].id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredFiles, selectedIndex, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div 
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-[var(--border)]"
        style={{ backgroundColor: 'var(--bg-paper)' }}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search size={18} className="opacity-40" style={{ color: 'var(--text-main)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-40"
            style={{ color: 'var(--text-main)' }}
          />
          <div className="text-[10px] opacity-40 px-2 py-0.5 rounded border border-[var(--border)]">ESC</div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filteredFiles.map((file, idx) => (
            <div
              key={file.id}
              onClick={() => {
                onSelect(file.id);
                onClose();
              }}
              className={`
                flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg cursor-pointer text-sm transition-colors
                ${idx === selectedIndex ? 'bg-[var(--bg-main)]' : 'hover:bg-black/5'}
              `}
            >
              <FileText size={14} className="opacity-50" style={{ color: 'var(--text-main)' }} />
              <span style={{ color: 'var(--text-main)' }}>{file.title || 'Untitled'}</span>
              {idx === selectedIndex && (
                 <span className="ml-auto text-[10px] opacity-50" style={{ color: 'var(--text-muted)' }}>Enter to open</span>
              )}
            </div>
          ))}
          {filteredFiles.length === 0 && (
            <div className="p-4 text-center text-sm opacity-50" style={{ color: 'var(--text-muted)' }}>
              No matching files found
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

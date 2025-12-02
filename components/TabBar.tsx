
import React, { useState } from 'react';
import { DocFile } from '../types';
import { X } from 'lucide-react';

interface TabBarProps {
  files: DocFile[];
  activeFileId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string, e: React.MouseEvent) => void;
  onRename: (id: string, newName: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ files, activeFileId, onSelect, onClose, onRename }) => {
  const openFiles = files.filter(f => f.isOpened);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (openFiles.length === 0) return null;

  const startEditing = (file: DocFile) => {
      setEditingId(file.id);
      setEditValue(file.title);
  };

  const saveEditing = () => {
      if (editingId) {
          onRename(editingId, editValue);
          setEditingId(null);
      }
  };

  return (
    <div 
      className="flex items-center gap-1 px-4 pt-2 overflow-x-auto w-full border-b border-[var(--border)] shrink-0 no-scrollbar select-none"
      style={{ backgroundColor: 'var(--bg-main)' }}
    >
      {openFiles.map(file => {
          const isEditing = editingId === file.id;

          return (
            <div
              key={file.id}
              onClick={() => onSelect(file.id)}
              onDoubleClick={() => startEditing(file)}
              className={`
                flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] rounded-t-lg text-xs cursor-pointer border-t border-l border-r border-[var(--border)] transition-all
                ${file.id === activeFileId 
                  ? 'bg-[var(--bg-paper)] font-medium translate-y-[1px] border-b-[var(--bg-paper)]' 
                  : 'bg-transparent opacity-60 hover:opacity-100 border-transparent hover:bg-black/5'}
              `}
              style={{ color: 'var(--text-main)' }}
            >
              {isEditing ? (
                  <input 
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEditing}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                      autoFocus
                      className="w-full bg-transparent border-none outline-none p-0"
                      onClick={(e) => e.stopPropagation()}
                  />
              ) : (
                  <span className="truncate flex-1">{file.title || 'Untitled'}</span>
              )}
              
              {!isEditing && (
                  <button
                    onClick={(e) => onClose(file.id, e)}
                    className="p-0.5 rounded-full hover:bg-black/10 opacity-60 hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
              )}
            </div>
          );
      })}
    </div>
  );
};

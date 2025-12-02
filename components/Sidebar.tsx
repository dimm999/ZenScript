
import React, { useState } from 'react';
import { DocFile } from '../types';
import { Plus, FileText, Trash2, ChevronRight, ChevronDown, CornerDownRight } from 'lucide-react';

interface SidebarProps {
  files: DocFile[];
  activeFileId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId?: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onRename: (id: string, newName: string) => void;
  onMove: (dragId: string, targetId: string | null) => void;
  visible: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  files, 
  activeFileId, 
  onSelect, 
  onCreate, 
  onDelete,
  onRename,
  onMove,
  visible 
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  if (!visible) return null;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSet = new Set(expandedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setExpandedIds(newSet);
  };

  const startEditing = (file: DocFile, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent double click from potentially expanding if logic overlapped
      setEditingId(file.id);
      setEditValue(file.title);
  };

  const saveEditing = () => {
      if (editingId) {
          onRename(editingId, editValue);
          setEditingId(null);
      }
  };

  // --- Drag & Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string | null) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    const dragId = e.dataTransfer.getData('text/plain');
    if (dragId) {
        onMove(dragId, targetId);
        // If dropped on a folder, expand it to show the moved item
        if (targetId) {
            setExpandedIds(prev => new Set(prev).add(targetId));
        }
    }
  };

  // Recursive Tree Rendering
  const renderTree = (parentId: string | null = null, depth: number = 0) => {
      const children = files.filter(f => (f.parentId || null) === parentId);
      
      if (children.length === 0) return null;

      return children.map(file => {
          const hasChildren = files.some(f => f.parentId === file.id);
          const isExpanded = expandedIds.has(file.id);
          const isActive = file.id === activeFileId;
          const isEditing = editingId === file.id;
          const isDragTarget = dragOverId === file.id;

          return (
              <div key={file.id}>
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, file.id)}
                    onDragOver={(e) => handleDragOver(e, file.id)}
                    onDrop={(e) => handleDrop(e, file.id)}
                    onClick={() => onSelect(file.id)}
                    onDoubleClick={(e) => startEditing(file, e)}
                    className={`
                      group flex items-center gap-2 px-2 py-1.5 mx-2 rounded-md cursor-pointer transition-all text-sm
                      ${isActive ? 'bg-black/5 font-medium' : 'hover:bg-black/5 opacity-70 hover:opacity-100'}
                      ${isDragTarget ? 'ring-2 ring-[var(--text-main)] bg-[var(--selection)] opacity-100 scale-[1.02]' : ''}
                    `}
                    style={{ 
                        color: 'var(--text-main)',
                        paddingLeft: `${depth * 12 + 8}px`
                    }}
                  >
                    {/* Expand/Collapse Toggle */}
                    <button 
                        onClick={(e) => toggleExpand(file.id, e)}
                        className={`p-0.5 rounded hover:bg-black/10 transition-opacity ${hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>

                    <FileText size={14} className="opacity-70 shrink-0" />
                    
                    {/* Title or Input */}
                    {isEditing ? (
                        <input 
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEditing}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                            autoFocus
                            className="flex-1 bg-transparent border-b border-[var(--text-main)] outline-none min-w-0"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="truncate flex-1 select-none">{file.title || 'Untitled'}</span>
                    )}

                    {/* Actions (visible on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                             onClick={(e) => { e.stopPropagation(); onCreate(file.id); setExpandedIds(prev => new Set(prev).add(file.id)); }}
                             className="p-1 hover:text-green-600 transition-colors"
                             title="Add sub-page"
                         >
                            <Plus size={12} />
                         </button>
                        <button
                            onClick={(e) => onDelete(file.id, e)}
                            className="p-1 hover:text-red-500 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                  </div>
                  
                  {/* Children Recursion */}
                  {isExpanded && renderTree(file.id, depth + 1)}
              </div>
          );
      });
  };

  return (
    <div 
      className="h-full border-r border-[var(--border)] flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none"
      style={{ width: '260px', backgroundColor: 'var(--bg-main)' }}
    >
      <div 
        className={`p-4 flex items-center justify-between border-b border-[var(--border)] border-opacity-30 ${dragOverId === 'root' ? 'bg-[var(--selection)]' : ''}`}
        onDragOver={(e) => handleDragOver(e, 'root')}
        onDrop={(e) => handleDrop(e, null)} // Null for root
      >
        <span className="font-medium text-xs tracking-wider opacity-60" style={{ color: 'var(--text-muted)' }}>DOCUMENTS</span>
        <button 
          onClick={() => onCreate()}
          className="p-1.5 hover:bg-black/5 rounded transition-colors"
          style={{ color: 'var(--text-main)' }}
          title="New Page"
        >
          <Plus size={16} />
        </button>
      </div>

      <div 
        className="flex-1 overflow-y-auto py-3 min-h-0"
        onDragOver={(e) => { e.preventDefault(); if(!dragOverId) setDragOverId('root'); }} 
        onDrop={(e) => { if(dragOverId === 'root') handleDrop(e, null); }}
      >
        {renderTree(null, 0)}
        
        {files.length === 0 && (
          <div className="text-center p-6 text-xs opacity-50" style={{ color: 'var(--text-muted)' }}>
            No files yet.
          </div>
        )}
        
        {/* Empty area also acts as drop-to-root zone */}
        <div className="h-full flex-grow" onDragOver={(e) => handleDragOver(e, 'root')} onDrop={(e) => handleDrop(e, null)} />
      </div>
    </div>
  );
};


import React, { useRef, useState } from 'react';
import { EditorSettings, Block, TextBlockData, ImageBlockData } from '../types';
import { FONTS, generateId } from '../constants';
import { TextBlock } from './blocks/TextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { ImagePlus, GripVertical } from 'lucide-react';

interface EditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  settings: EditorSettings;
  onInteraction: () => void;
}

export const Editor: React.FC<EditorProps> = ({ blocks, onChange, settings, onInteraction }) => {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Drag & Drop State
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | 'merge' | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // Helper to read files as DataURL
  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // --- Block Management ---

  const updateBlock = (id: string, data: Partial<Block>) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...data } as Block : b);
    onChange(newBlocks);
    onInteraction();
  };

  const addTextBlock = (afterId: string, content: string = '') => {
    const newBlock: TextBlockData = {
      id: generateId(),
      type: 'text',
      content
    };
    const index = blocks.findIndex(b => b.id === afterId);
    if (index === -1) {
        onChange([...blocks, newBlock]);
    } else {
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        onChange(newBlocks);
    }
    setFocusedBlockId(newBlock.id);
    onInteraction();
  };

  const removeBlock = (id: string) => {
    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = blocks.filter(b => b.id !== id);
    onChange(newBlocks);
    
    // Focus previous block if exists
    if (index > 0) {
        setFocusedBlockId(newBlocks[index - 1].id);
    }
    onInteraction();
  };

  // --- Image Handling ---

  const insertImages = async (fileList: File[], targetBlockId?: string, isGridAdd: boolean = false) => {
      const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
      if (files.length === 0) return;

      const imageUrls = await Promise.all(files.map(readFile));
      
      if (isGridAdd && targetBlockId) {
          // Add to existing grid
          const block = blocks.find(b => b.id === targetBlockId) as ImageBlockData;
          if (block && block.type === 'image') {
              const newImages = [...block.images, ...imageUrls.map(url => ({ id: generateId(), url }))];
              updateBlock(targetBlockId, { images: newImages });
          }
      } else {
          // Create new image block
          const imageBlock: ImageBlockData = {
              id: generateId(),
              type: 'image',
              align: 'center',
              width: 80,
              images: imageUrls.map(url => ({ id: generateId(), url }))
          };
          
          if (targetBlockId) {
              const index = blocks.findIndex(b => b.id === targetBlockId);
              const newBlocks = [...blocks];
              newBlocks.splice(index + 1, 0, imageBlock);
              
              // Add a text block after the image so user can type
              newBlocks.splice(index + 2, 0, { id: generateId(), type: 'text', content: '' });
              
              onChange(newBlocks);
          } else {
              // Append to end
              onChange([...blocks, imageBlock, { id: generateId(), type: 'text', content: '' }]);
          }
      }
      onInteraction();
  };

  // --- Drag and Drop Handlers (Block Reordering & Merging) ---

  const handleBlockDragStart = (e: React.DragEvent, id: string) => {
    setDragSourceId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id); // Required for Firefox
  };

  const handleBlockDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (dragSourceId === targetId) return;

    const targetBlock = blocks.find(b => b.id === targetId);
    const sourceBlock = blocks.find(b => b.id === dragSourceId);

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // Check for Merge Candidate (Image -> Image)
    if (sourceBlock?.type === 'image' && targetBlock?.type === 'image') {
        // If hovering in the middle 50%, consider it a merge
        if (y > height * 0.25 && y < height * 0.75) {
            setDropPosition('merge');
            setDropTargetId(targetId);
            return;
        }
    }

    // Default Reordering (Top/Bottom)
    if (y < height / 2) {
        setDropPosition('top');
    } else {
        setDropPosition('bottom');
    }
    setDropTargetId(targetId);
  };

  const handleBlockDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false); // Ensure global overlay is off
    
    if (!dragSourceId || dragSourceId === targetId) {
        setDragSourceId(null);
        setDropTargetId(null);
        setDropPosition(null);
        return;
    }

    const newBlocks = [...blocks];
    const sourceIndex = newBlocks.findIndex(b => b.id === dragSourceId);
    if (sourceIndex === -1) return;
    
    const sourceBlock = newBlocks[sourceIndex];

    // MERGE LOGIC
    if (dropPosition === 'merge') {
        const targetIndex = newBlocks.findIndex(b => b.id === targetId);
        const targetBlock = newBlocks[targetIndex];
        
        if (sourceBlock.type === 'image' && targetBlock.type === 'image') {
            // Merge images from source to target
            targetBlock.images = [...targetBlock.images, ...sourceBlock.images];
            // Remove source block
            newBlocks.splice(sourceIndex, 1);
            onChange(newBlocks);
        }
    } 
    // REORDER LOGIC
    else {
        // Remove source
        newBlocks.splice(sourceIndex, 1);
        
        // Find new index for target
        let targetIndex = newBlocks.findIndex(b => b.id === targetId);
        
        if (dropPosition === 'bottom') targetIndex++;
        
        // Insert
        newBlocks.splice(targetIndex, 0, sourceBlock);
        onChange(newBlocks);
    }

    // Reset
    setDragSourceId(null);
    setDropTargetId(null);
    setDropPosition(null);
    onInteraction();
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.types.includes('Files')) {
        if (e.dataTransfer.files.length > 0) {
            const lastBlockId = blocks.length > 0 ? blocks[blocks.length - 1].id : undefined;
            insertImages(Array.from(e.dataTransfer.files), lastBlockId);
        }
    }
  };
  
  const handleContainerDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      // Only show overlay if dragging FILES, not internal blocks
      if (e.dataTransfer.types.includes('Files')) {
          setIsDragOver(true);
      }
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      if (editorRef.current && !editorRef.current.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
      }
  };

  // New Global Click Handler
  const handleEditorClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || e.target === editorRef.current) {
          // If clicked on empty space, check if we need to append a block
          if (blocks.length === 0) {
              const newBlock: TextBlockData = { id: generateId(), type: 'text', content: '' };
              onChange([newBlock]);
              setFocusedBlockId(newBlock.id);
          } else {
              const lastBlock = blocks[blocks.length - 1];
              
              if (lastBlock.type === 'image') {
                  // Always add text after image
                  addTextBlock(lastBlock.id);
              } else {
                  // It is text
                  const textBlock = lastBlock as TextBlockData;
                  if (textBlock.content.trim().length === 0) {
                      // Already has an empty line at the end, just focus it
                      setFocusedBlockId(null);
                      setTimeout(() => setFocusedBlockId(lastBlock.id), 0);
                  } else {
                      // Last line has content, create a new one to mimic "New Line"
                      addTextBlock(lastBlock.id);
                  }
              }
          }
      }
  };

  const currentFont = FONTS[settings.fontFamily];

  return (
    <div 
        ref={editorRef}
        className="w-full mx-auto px-8 md:px-16 py-12 md:py-20 transition-all duration-700 ease-in-out min-h-[80vh] relative cursor-text"
        onDrop={handleGlobalDrop}
        onDragOver={handleContainerDragOver}
        onDragLeave={handleContainerDragLeave}
        onClick={handleEditorClick}
    >
      {/* Drop Zone Overlay */}
      {isDragOver && (
          <div className="absolute inset-4 z-50 rounded-lg border-2 border-dashed border-[var(--text-main)] bg-[var(--bg-paper)] bg-opacity-90 flex flex-col items-center justify-center pointer-events-none">
              <ImagePlus size={48} className="opacity-50 mb-2" style={{ color: 'var(--text-main)' }} />
              <p className="text-lg font-medium opacity-70" style={{ color: 'var(--text-main)' }}>Drop images here</p>
          </div>
      )}

      {blocks.map((block) => {
        const isDragTarget = dropTargetId === block.id;
        
        return (
            <div 
                key={block.id}
                className={`
                    relative group/block transition-all duration-200
                    ${isDragTarget && dropPosition === 'top' ? 'border-t-2 border-blue-400 pt-2' : ''}
                    ${isDragTarget && dropPosition === 'bottom' ? 'border-b-2 border-blue-400 pb-2' : ''}
                    ${isDragTarget && dropPosition === 'merge' ? 'ring-2 ring-blue-400 rounded-lg' : ''}
                    ${dragSourceId === block.id ? 'opacity-30' : 'opacity-100'}
                `}
                draggable
                onDragStart={(e) => handleBlockDragStart(e, block.id)}
                onDragOver={(e) => handleBlockDragOver(e, block.id)}
                onDrop={(e) => handleBlockDrop(e, block.id)}
            >
                {/* Drag Handle */}
                <div 
                    className="absolute -left-8 top-1 opacity-0 group-hover/block:opacity-30 hover:!opacity-100 cursor-grab active:cursor-grabbing transition-opacity p-1"
                    style={{ color: 'var(--text-main)' }}
                >
                    <GripVertical size={16} />
                </div>

                {block.type === 'text' ? (
                    <TextBlock 
                        block={block as TextBlockData}
                        onChange={(content) => updateBlock(block.id, { content })}
                        onEnter={(e) => addTextBlock(block.id)}
                        onBackspace={(e) => {
                             if (blocks.length > 1) removeBlock(block.id);
                        }}
                        styles={{ ...settings, cssClass: currentFont.cssClass }}
                        isFocused={focusedBlockId === block.id}
                    />
                ) : (
                    <ImageBlock 
                        block={block as ImageBlockData}
                        onUpdate={(data) => updateBlock(block.id, data)}
                        onRemove={() => removeBlock(block.id)}
                        onImageDrop={(id, files) => insertImages(files, id, true)}
                    />
                )}
            </div>
        );
      })}
      
      {/* Click target for empty space at bottom */}
      <div className="h-32 w-full" />
    </div>
  );
};

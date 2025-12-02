
import React, { useRef, useState } from 'react';
import { ImageBlockData } from '../../types';
import { Trash2, AlignLeft, AlignCenter, AlignRight, Download, Grid } from 'lucide-react';

interface ImageBlockProps {
  block: ImageBlockData;
  onUpdate: (data: Partial<ImageBlockData>) => void;
  onRemove: () => void;
  onImageDrop: (targetBlockId: string, files: File[]) => void;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({ block, onUpdate, onRemove, onImageDrop }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Resizing Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = block.width || 100;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const container = containerRef.current?.parentElement;
      if (!container) return;
      
      const containerWidth = container.offsetWidth;
      const deltaX = moveEvent.clientX - startX;
      // Convert pixel delta to percentage delta
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      let newWidth = Math.min(100, Math.max(20, startWidth + deltaPercent));
      onUpdate({ width: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // --- File Drop Logic (for adding new images from OS) ---
  const handleDrop = (e: React.DragEvent) => {
    // Note: The parent Editor handles block-to-block drag. 
    // This handler checks specifically for FILE drops from OS.
    if (e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
          if (files.length > 0) {
             onImageDrop(block.id, files);
          }
        }
    }
  };

  // --- Download Logic ---
  const downloadImage = (url: string, index: number) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  // Determine grid columns
  const gridCols = block.images.length === 1 ? 'grid-cols-1' : block.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div 
      className={`relative group my-4 transition-all duration-200 select-none
        ${block.align === 'left' ? 'mr-auto' : block.align === 'right' ? 'ml-auto' : 'mx-auto'}
      `}
      style={{ width: `${block.width}%` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault(); 
              setDragOver(true); 
          }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      ref={containerRef}
    >
      {/* File Grouping Overlay */}
      {dragOver && (
          <div className="absolute inset-0 z-20 bg-[var(--selection)] bg-opacity-50 border-2 border-dashed border-[var(--text-main)] rounded-lg flex items-center justify-center pointer-events-none">
             <div className="bg-[var(--bg-paper)] px-4 py-2 rounded-full shadow-md flex items-center gap-2">
                 <Grid size={16} />
                 <span className="text-xs font-medium">Drop to Add</span>
             </div>
          </div>
      )}

      {/* Image Grid Container */}
      <div className={`grid ${gridCols} gap-3 w-full`}>
          {block.images.map((img, idx) => (
             <div key={img.id} className="relative group/image">
                 <img 
                    src={img.url} 
                    alt="Content" 
                    className="w-full h-auto rounded-lg shadow-sm"
                    draggable={false}
                 />
                 
                 {/* Individual Image Actions */}
                 <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity flex gap-1 z-10">
                    <button 
                        onClick={() => downloadImage(img.url, idx)}
                        className="p-1.5 bg-black/50 text-white rounded hover:bg-black/70 backdrop-blur-sm"
                        title="Download"
                    >
                        <Download size={12} />
                    </button>
                    {block.images.length > 1 && (
                         <button 
                         onClick={() => {
                             const newImages = block.images.filter(i => i.id !== img.id);
                             if(newImages.length === 0) onRemove();
                             else onUpdate({ images: newImages });
                         }}
                         className="p-1.5 bg-red-500/80 text-white rounded hover:bg-red-600 backdrop-blur-sm"
                         title="Remove from grid"
                        >
                         <Trash2 size={12} />
                        </button>
                    )}
                 </div>
             </div>
          ))}
      </div>

      {/* Caption Input */}
      <div className="mt-3 text-center">
         <input 
            type="text" 
            value={block.images[0]?.caption || ''} 
            onChange={(e) => {
                const newImages = [...block.images];
                if(newImages[0]) newImages[0].caption = e.target.value;
                onUpdate({ images: newImages });
            }}
            placeholder="Write a caption..."
            className="w-full text-center bg-transparent border-none outline-none text-sm font-medium opacity-60 focus:opacity-100 placeholder:opacity-40 font-serif"
            style={{ color: 'var(--text-muted)' }}
         />
      </div>

      {/* Block Controls (Alignment, Delete) */}
      <div 
        className={`
            absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 
            bg-[var(--bg-paper)] rounded-lg shadow-xl border border-[var(--border)]
            transition-all duration-200 z-30
            ${isHovering || isResizing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
        `}
      >
        <button onClick={() => onUpdate({ align: 'left' })} className={`p-1.5 rounded hover:bg-black/5 ${block.align === 'left' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}><AlignLeft size={14}/></button>
        <button onClick={() => onUpdate({ align: 'center' })} className={`p-1.5 rounded hover:bg-black/5 ${block.align === 'center' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}><AlignCenter size={14}/></button>
        <button onClick={() => onUpdate({ align: 'right' })} className={`p-1.5 rounded hover:bg-black/5 ${block.align === 'right' ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}><AlignRight size={14}/></button>
        <div className="w-px h-3 bg-[var(--border)] mx-1" />
        <button onClick={onRemove} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14}/></button>
      </div>

      {/* Resize Handle */}
      <div 
        className={`
            absolute -right-4 bottom-0 w-6 h-full cursor-ew-resize flex items-center justify-center
            opacity-0 hover:opacity-100 transition-opacity
            ${isHovering ? 'opacity-30' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        <div className="w-1 h-12 bg-[var(--border)] rounded-full" />
      </div>

    </div>
  );
};

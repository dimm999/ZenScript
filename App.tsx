
import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Download, Trash2, Maximize2, Minimize2, MoreHorizontal, Layout } from 'lucide-react';
import { Editor } from './components/Editor';
import { SettingsPanel } from './components/SettingsPanel';
import { Button } from './components/Button';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';
import { CommandPalette } from './components/CommandPalette';
import { EditorSettings, DocFile, Block, TextBlockData } from './types';
import { THEMES, DEFAULT_SETTINGS, generateId } from './constants';

const App: React.FC = () => {
  // State initialization
  const [files, setFiles] = useState<DocFile[]>(() => {
    const savedFiles = localStorage.getItem('zen_files');
    if (savedFiles) {
        return JSON.parse(savedFiles);
    }
    // Migration for legacy users
    const oldContent = localStorage.getItem('zen_content');
    const initialBlock: TextBlockData = { id: generateId(), type: 'text', content: oldContent || '' };
    return [{
        id: generateId(),
        title: 'Untitled Draft',
        blocks: [initialBlock],
        lastModified: Date.now(),
        isOpened: true
    }];
  });

  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
     // Default to first file if exists
     const savedFiles = localStorage.getItem('zen_files');
     if(savedFiles) {
         const parsed = JSON.parse(savedFiles);
         return parsed.length > 0 ? parsed[0].id : null;
     }
     return null; // Will be set after initial files render
  });

  const [settings, setSettings] = useState<EditorSettings>(() => {
    const saved = localStorage.getItem('zen_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [uiTimeout, setUiTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Sync activeFileId on init if needed
  useEffect(() => {
      if (!activeFileId && files.length > 0) {
          setActiveFileId(files[0].id);
      }
  }, []);

  const currentTheme = THEMES.find(t => t.id === settings.themeId) || THEMES[0];
  const activeFile = files.find(f => f.id === activeFileId);

  // Apply CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;
    
    root.style.setProperty('--bg-main', colors.bgMain);
    root.style.setProperty('--bg-paper', colors.bgPaper);
    root.style.setProperty('--text-main', colors.textMain);
    root.style.setProperty('--text-muted', colors.textMuted);
    root.style.setProperty('--cursor', colors.cursor);
    root.style.setProperty('--selection', colors.selection);
    root.style.setProperty('--border', colors.border);

    document.body.style.backgroundColor = colors.bgMain;
  }, [currentTheme]);

  // Persist data
  useEffect(() => {
    localStorage.setItem('zen_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('zen_settings', JSON.stringify(settings));
  }, [settings]);

  // Command Palette Shortcut
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
              e.preventDefault();
              setIsCommandPaletteOpen(true);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- File Operations ---

  const handleUpdateContent = (newBlocks: Block[]) => {
      if (!activeFileId) return;
      
      setFiles(prev => prev.map(f => {
          if (f.id === activeFileId) {
              return { ...f, blocks: newBlocks, lastModified: Date.now() };
          }
          return f;
      }));
  };

  const handleRenameFile = (id: string, newTitle: string) => {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, title: newTitle } : f));
  };

  const handleCreateFile = (parentId?: string) => {
      const newFile: DocFile = {
          id: generateId(),
          parentId: parentId, // Set parent if creating a sub-page
          title: 'New Page',
          blocks: [{ id: generateId(), type: 'text', content: '' }],
          lastModified: Date.now(),
          isOpened: true
      };
      setFiles(prev => {
          // If adding a child, we want to expand the parent in the UI logic (Sidebar handles this via open state, but here we just add data)
          return [...prev, newFile];
      });
      setActiveFileId(newFile.id);
  };

  const handleMoveFile = (dragId: string, targetId: string | null) => {
      // 1. Check self drop
      if (dragId === targetId) return;
  
      // 2. Circular check: Ensure target is not a child of dragged
      // Traverse up from targetId to see if we hit dragId
      let currentId = targetId;
      while(currentId) {
          const current = files.find(f => f.id === currentId);
          if (current?.id === dragId) {
              console.warn("Cannot move parent into child");
              return; 
          }
          currentId = current?.parentId || null;
      }
  
      setFiles(prev => prev.map(f => {
          if (f.id === dragId) return { ...f, parentId: targetId || undefined };
          return f;
      }));
  };

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.confirm('Delete this file and its children?')) return;
      
      // Recursive delete helper
      const getIdsToDelete = (rootId: string, fileList: DocFile[]): string[] => {
          const children = fileList.filter(f => f.parentId === rootId);
          const childIds = children.flatMap(c => getIdsToDelete(c.id, fileList));
          return [rootId, ...childIds];
      };

      const idsToDelete = getIdsToDelete(id, files);
      
      setFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));
      
      if (idsToDelete.includes(activeFileId || '')) {
          const remaining = files.filter(f => !idsToDelete.includes(f.id));
          setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
      }
  };

  const handleOpenFile = (id: string) => {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpened: true } : f));
      setActiveFileId(id);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setFiles(prev => prev.map(f => f.id === id ? { ...f, isOpened: false } : f));
      if (activeFileId === id) {
          // Find another open file
          const otherOpen = files.find(f => f.isOpened && f.id !== id);
          setActiveFileId(otherOpen ? otherOpen.id : null);
      }
  };

  // Focus Mode Logic
  const handleInteraction = useCallback(() => {
    if (!settings.isFocusMode) {
      setIsUiVisible(true);
      return;
    }
    setIsUiVisible(false);
    setIsMenuOpen(false);
    if (uiTimeout) clearTimeout(uiTimeout);
    const timeout = setTimeout(() => {
      setIsUiVisible(true);
    }, 1500);
    setUiTimeout(timeout);
  }, [settings.isFocusMode, uiTimeout]);

  // Mouse movement handler
  const handleMouseMove = useCallback(() => {
    if (!isUiVisible) {
      setIsUiVisible(true);
      if (uiTimeout) clearTimeout(uiTimeout);
    }
  }, [isUiVisible, uiTimeout]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div 
      className="min-h-screen w-full transition-colors duration-700 ease-in-out relative flex overflow-hidden"
      style={{ backgroundColor: 'var(--bg-main)' }}
      onMouseMove={handleMouseMove}
    >
      <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          files={files}
          onSelect={handleOpenFile}
      />

      {/* Sidebar */}
      <Sidebar 
          files={files}
          activeFileId={activeFileId}
          onSelect={handleOpenFile}
          onCreate={handleCreateFile}
          onDelete={handleDeleteFile}
          onRename={handleRenameFile}
          onMove={handleMoveFile}
          visible={settings.sidebarVisible && isUiVisible}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen relative">
         
         {/* Top Bar (Tabs + Actions) */}
         <div 
            className={`
                flex flex-col transition-all duration-500 z-40
                ${isUiVisible || isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}
            `}
         >
             {/* Toolbar */}
            <header className="flex justify-between items-center p-4">
                <div className="flex items-center gap-4">
                   <button 
                       onClick={() => setSettings(s => ({ ...s, sidebarVisible: !s.sidebarVisible }))}
                       className="p-2 rounded hover:bg-black/5 transition-colors"
                       style={{ color: 'var(--text-main)' }}
                   >
                       <Layout size={18} />
                   </button>
                   <div>
                       <h1 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>ZenScript</h1>
                       <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {activeFile ? `${activeFile.blocks.filter(b => b.type === 'text').reduce((acc, b) => acc + (b as TextBlockData).content.length, 0)} chars` : 'No file'}
                       </p>
                   </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="flex items-center gap-1 bg-[var(--bg-paper)] p-1 rounded-xl shadow-sm border border-[var(--border)] transition-colors duration-500">
                        <Button 
                            onClick={toggleFullScreen} 
                            icon={<Maximize2 size={18} />} 
                            title="Toggle Fullscreen"
                            className="hidden sm:flex"
                        />
                        <div className="w-px h-6 bg-[var(--border)] mx-1" />
                        <Button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)} 
                            active={isMenuOpen}
                            icon={isMenuOpen ? <MoreHorizontal size={18} /> : <Settings size={18} />}
                            title="Settings"
                        />
                    </div>
                </div>
            </header>
            
            <TabBar 
                files={files}
                activeFileId={activeFileId}
                onSelect={handleOpenFile}
                onClose={handleCloseTab}
                onRename={handleRenameFile}
            />
            
            <SettingsPanel 
                settings={settings} 
                onUpdate={(newSettings) => setSettings({ ...settings, ...newSettings })}
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />
         </div>

         {/* Editor Area */}
         <main className="flex-1 overflow-y-auto w-full relative">
            {activeFile ? (
                <div className="flex justify-center pt-8 pb-32 min-h-full">
                    <div 
                        className={`
                            w-full rounded-xl shadow-sm md:shadow-2xl transition-all duration-700 ease-in-out
                            relative
                        `}
                        style={{ 
                            backgroundColor: 'var(--bg-paper)',
                            maxWidth: `${settings.editorWidth}px`,
                            minHeight: '80vh'
                        }}
                    >
                        {/* Paper styling */}
                        <div className="w-full h-1 opacity-10 absolute top-0 left-0 right-0 bg-black/10" />
                        
                        <Editor 
                            blocks={activeFile.blocks}
                            onChange={handleUpdateContent}
                            settings={settings}
                            onInteraction={handleInteraction}
                        />

                         <div 
                            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none transition-colors duration-700"
                            style={{ 
                            background: `linear-gradient(to top, var(--bg-paper), transparent)` 
                            }} 
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-50" style={{ color: 'var(--text-muted)' }}>
                    <p>Select a file or create a new one</p>
                    <button onClick={() => handleCreateFile()} className="mt-4 px-4 py-2 bg-black/5 hover:bg-black/10 rounded">
                        Create New
                    </button>
                    <p className="mt-2 text-xs">or press Ctrl+P to search</p>
                </div>
            )}
         </main>

         {/* Footer */}
         <footer 
            className={`
            fixed bottom-4 right-4 text-xs transition-opacity duration-700 pointer-events-none
            ${isUiVisible ? 'opacity-40' : 'opacity-0'}
            `}
            style={{ color: 'var(--text-muted)' }}
        >
            <p>ZenScript</p>
        </footer>

      </div>
    </div>
  );
};

export default App;

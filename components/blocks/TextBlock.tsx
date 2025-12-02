
import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { TextBlockData } from '../../types';

interface TextBlockProps {
  block: TextBlockData;
  onChange: (content: string) => void;
  onEnter: (e: React.KeyboardEvent) => void;
  onBackspace: (e: React.KeyboardEvent) => void;
  styles: { fontSize: number; fontFamily: string; cssClass: string };
  isFocused?: boolean;
}

export const TextBlock: React.FC<TextBlockProps> = ({ 
  block, 
  onChange, 
  onEnter, 
  onBackspace, 
  styles,
  isFocused 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);

  // Sync content from Props to DOM
  // We use useLayoutEffect to prevent flickering if a paint were to happen between render and effect
  useLayoutEffect(() => {
    if (!contentRef.current) return;

    // IF this is the first render, set the content.
    if (initialRender.current) {
        if (contentRef.current.innerHTML !== block.content) {
            contentRef.current.innerHTML = block.content;
        }
        initialRender.current = false;
        return;
    }

    // STRICT CHECK:
    // If the element is currently focused (user is typing), DO NOT overwrite the DOM with props.
    // The DOM is the source of truth during typing. Overwriting it (even with same content) 
    // can reset the cursor position to the start in some browsers/react versions.
    if (document.activeElement === contentRef.current) {
        return;
    }

    // If not focused (e.g. Undo/Redo or file switch), sync props to DOM
    if (contentRef.current.innerHTML !== block.content) {
        contentRef.current.innerHTML = block.content;
    }
  }, [block.content]);

  // Handle Focus Request from Parent
  useEffect(() => {
    if (isFocused && contentRef.current) {
        if (document.activeElement !== contentRef.current) {
            contentRef.current.focus();
            // Move cursor to end on initial focus
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(contentRef.current);
            range.collapse(false);
            if(sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
  }, [isFocused]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    // We strictly trust the DOM event for content updates
    const newContent = e.currentTarget.innerHTML;
    onChange(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Shortcuts
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'b':
                e.preventDefault();
                document.execCommand('bold');
                break;
            case 'i':
                e.preventDefault();
                document.execCommand('italic');
                break;
            case 'u':
                e.preventDefault();
                document.execCommand('underline');
                break;
        }
        return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onEnter(e);
    }
    
    if (e.key === 'Backspace') {
        const selection = window.getSelection();
        // Check if empty or only contains a break tag
        // Note: innerText is unreliable for empty checks on some browsers, innerHTML is better
        // but need to handle <br>
        const html = contentRef.current?.innerHTML || '';
        const isEmpty = !contentRef.current?.innerText.trim() && (html === '' || html === '<br>');
        
        if (isEmpty) {
             onBackspace(e);
        }
    }
  };

  return (
    <div
      ref={contentRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={`
        w-full bg-transparent outline-none ring-0 block
        empty:before:content-['Type_something...'] empty:before:text-[var(--text-muted)] empty:before:opacity-40
        selection:bg-[var(--selection)]
        ${styles.cssClass}
      `}
      style={{
        fontSize: `${styles.fontSize}px`,
        lineHeight: '1.6',
        color: 'var(--text-main)',
        caretColor: 'var(--cursor)',
        padding: '2px 0', 
        minHeight: '1.5em',
        marginBottom: '0.5rem',
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-word',
        textAlign: 'left'
      }}
    />
  );
};

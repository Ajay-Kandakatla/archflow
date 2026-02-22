import { useEffect } from 'react';
import type { ToolMode } from '@/types';

interface UseKeyboardOptions {
  onSetTool: (tool: ToolMode) => void;
  onDelete: () => void;
  onSave: () => void;
  onExport: () => void;
  onFitToScreen: () => void;
  onSelectAll: () => void;
  onImageUpload: () => void;
  onCopy: () => void;
  onPaste: () => void;
}

export function useKeyboard({
  onSetTool, onDelete, onSave, onExport, onFitToScreen, onSelectAll, onImageUpload, onCopy, onPaste,
}: UseKeyboardOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'v':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onPaste();
          } else {
            onSetTool('select');
          }
          break;
        case 'c':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onCopy();
          } else {
            onSetTool('connect');
          }
          break;
        case 'n': onSetTool('note'); break;
        case 'i': onImageUpload(); break;
        case 'delete':
        case 'backspace':
          onDelete();
          break;
        case 's':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onSave();
          }
          break;
        case 'e':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onExport();
          }
          break;
        case 'f':
          if (e.shiftKey) {
            e.preventDefault();
            onFitToScreen();
          }
          break;
        case 'a':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            onSelectAll();
          }
          break;
        case 'escape':
          onSetTool('select');
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSetTool, onDelete, onSave, onExport, onFitToScreen, onSelectAll, onImageUpload, onCopy, onPaste]);
}

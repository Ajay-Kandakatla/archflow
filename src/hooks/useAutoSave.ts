import { useEffect, useRef } from 'react';
import { API } from '@/utils/api';
import type { DiagramData } from '@/types';

interface UseAutoSaveOptions {
  diagramId: string | null;
  authToken: string | null;
  data: DiagramData;
  enabled: boolean;
}

const LOCAL_STORAGE_KEY = 'archflow-local-diagram';

export function useAutoSave({ diagramId, authToken, data, enabled }: UseAutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    const serialized = JSON.stringify(data);
    if (serialized === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      // Always save to localStorage as a backup
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
      } catch (e) {
        // localStorage might be full, ignore
      }

      // If authenticated with a diagram ID, also save to server
      if (enabled && diagramId && authToken) {
        try {
          await API.update(diagramId, { data });
        } catch (e) {
          console.error('Auto-save failed:', e);
        }
      }
      lastSavedRef.current = serialized;
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [diagramId, authToken, data, enabled]);
}

/**
 * Load a locally saved diagram from localStorage.
 */
export function loadLocalDiagram(): DiagramData | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DiagramData;
  } catch {
    return null;
  }
}

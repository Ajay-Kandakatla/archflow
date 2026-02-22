import React, { useState, useCallback } from 'react';
import { useDiagramState } from '@/store/DiagramContext';

export function HintOverlay() {
  const state = useDiagramState();
  const [dismissed, setDismissed] = useState(false);

  const handleClick = useCallback(() => {
    setDismissed(true);
  }, []);

  // Hide if there are nodes on canvas or if dismissed
  if (dismissed || state.nodes.length > 0) return null;

  return (
    <div className="hint-overlay" id="hintOverlay" onClick={handleClick}>
      <div className="hint-box">
        <h2>Welcome to ArchFlow</h2>
        <p>
          Drag components from the sidebar onto the canvas.<br />
          Press <kbd>C</kbd> to connect nodes with animated arrows.<br />
          Press <kbd>N</kbd> to add sticky notes.<br />
          <kbd>Scroll</kbd> to pan, <kbd>Pinch</kbd> to zoom.<br />
          Right-click for more options.
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import { useDiagramState } from '@/store/DiagramContext';
import { CV } from '@/store/constants';

export function Minimap() {
  const state = useDiagramState();
  const mmW = 180, mmH = 120, cW = 8000;
  const scM = mmW / cW;

  return (
    <div className="minimap" id="minimap">
      {state.nodes.map(n => (
        <div key={n.id} className="minimap-node" style={{
          position: 'absolute',
          left: n.x * scM, top: n.y * scM,
          width: 4, height: 3,
          background: CV[n.color] || '#4f8ff7',
        }} />
      ))}
      <div className="minimap-viewport" id="minimapViewport" style={{
        position: 'absolute',
        left: -state.panX / state.scale * scM,
        top: -state.panY / state.scale * scM,
        width: (typeof window !== 'undefined' ? (window.innerWidth - 260) : 1000) / state.scale * scM,
        height: (typeof window !== 'undefined' ? (window.innerHeight - 52) : 600) / state.scale * scM,
      }} />
    </div>
  );
}

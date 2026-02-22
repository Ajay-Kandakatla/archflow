import React from 'react';

interface MarqueeSelectionProps {
  rect: { x: number; y: number; width: number; height: number } | null;
}

export function MarqueeSelection({ rect }: MarqueeSelectionProps) {
  if (!rect) return null;

  return (
    <div
      className="marquee-selection"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}

export function screenToCanvas(
  sx: number,
  sy: number,
  containerRect: DOMRect,
  panX: number,
  panY: number,
  scale: number
): { x: number; y: number } {
  return {
    x: (sx - containerRect.left - panX) / scale,
    y: (sy - containerRect.top - panY) / scale,
  };
}

export function getPortPosition(
  node: { x: number; y: number },
  port: string,
  width = 170,
  height = 90
): { x: number; y: number } {
  switch (port) {
    case 'top': return { x: node.x + width / 2, y: node.y };
    case 'bottom': return { x: node.x + width / 2, y: node.y + height };
    case 'left': return { x: node.x, y: node.y + height / 2 };
    case 'right': return { x: node.x + width, y: node.y + height / 2 };
    default: return { x: node.x, y: node.y };
  }
}

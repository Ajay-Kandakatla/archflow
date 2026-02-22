import { S } from './state.js';
import { updateTransform } from './canvas.js';

/**
 * Wheel handler: distinguishes trackpad scroll (pan) from pinch (zoom).
 * Browsers set e.ctrlKey = true for trackpad pinch gestures.
 *   ctrlKey === true  → ZOOM (pinch or Ctrl+scroll)
 *   ctrlKey === false → PAN  (two-finger scroll / mouse wheel)
 */
export function initWheelHandler(canvasContainer) {
    canvasContainer.addEventListener('wheel', e => {
        e.preventDefault();
        const r = canvasContainer.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;

        if (e.ctrlKey || e.metaKey) {
            // Pinch-to-zoom or Ctrl+scroll
            const zoomIntensity = 0.01;
            const oldScale = S.scale;
            const newScale = Math.max(0.15, Math.min(3, oldScale * (1 - e.deltaY * zoomIntensity)));
            S.scale = newScale;
            S.panX = mx - (mx - S.panX) * (newScale / oldScale);
            S.panY = my - (my - S.panY) * (newScale / oldScale);
        } else {
            // Two-finger scroll / mouse wheel → PAN
            S.panX -= e.deltaX;
            S.panY -= e.deltaY;
        }

        updateTransform();
    }, { passive: false });
}

/**
 * Touch handlers for mobile/tablet:
 *   - Two-finger pinch → ZOOM (with simultaneous pan)
 *   - Two-finger swipe → PAN
 *   - Single-finger drag on empty canvas → PAN
 */
export function initTouchHandlers(canvasContainer) {
    const PINCH_THRESHOLD = 0.02; // 2% distance change required for zoom

    function getTouchDist(t1, t2) {
        return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    }

    function getTouchMid(t1, t2) {
        return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
    }

    canvasContainer.addEventListener('touchstart', e => {
        if (e.touches.length === 2) {
            e.preventDefault();
            S.touchState.active = true;
            S.touchState.lastDist = getTouchDist(e.touches[0], e.touches[1]);
            const mid = getTouchMid(e.touches[0], e.touches[1]);
            S.touchState.lastMidX = mid.x; S.touchState.lastMidY = mid.y;
            S.touchState.startPanX = S.panX; S.touchState.startPanY = S.panY;
        } else if (e.touches.length === 1 &&
            !e.target.closest('.node') && !e.target.closest('.sticky-note') && !e.target.closest('.canvas-image')) {
            S.touchState.active = true;
            S.touchState.lastMidX = e.touches[0].clientX; S.touchState.lastMidY = e.touches[0].clientY;
            S.touchState.startPanX = S.panX; S.touchState.startPanY = S.panY;
            S.touchState.lastDist = 0; // 0 = single-finger mode
        }
    }, { passive: false });

    canvasContainer.addEventListener('touchmove', e => {
        if (e.touches.length === 2 && S.touchState.active) {
            e.preventDefault();
            const dist = getTouchDist(e.touches[0], e.touches[1]);
            const mid = getTouchMid(e.touches[0], e.touches[1]);
            const r = canvasContainer.getBoundingClientRect();
            const mx = mid.x - r.left, my = mid.y - r.top;

            const pinchRatio = dist / S.touchState.lastDist;
            const distChange = Math.abs(1 - pinchRatio);

            if (distChange > PINCH_THRESHOLD) {
                // Pinch zoom — finger distance changed significantly
                const oldScale = S.scale;
                S.scale = Math.max(0.15, Math.min(3, S.scale * pinchRatio));
                S.panX = mx - (mx - S.panX) * (S.scale / oldScale);
                S.panY = my - (my - S.panY) * (S.scale / oldScale);
            }

            // Pan always applied (midpoint movement)
            S.panX += mid.x - S.touchState.lastMidX;
            S.panY += mid.y - S.touchState.lastMidY;

            S.touchState.lastDist = dist;
            S.touchState.lastMidX = mid.x; S.touchState.lastMidY = mid.y;
            updateTransform();
        } else if (e.touches.length === 1 && S.touchState.active && S.touchState.lastDist === 0) {
            // Single finger pan
            e.preventDefault();
            const dx = e.touches[0].clientX - S.touchState.lastMidX;
            const dy = e.touches[0].clientY - S.touchState.lastMidY;
            S.panX = S.touchState.startPanX + dx;
            S.panY = S.touchState.startPanY + dy;
            updateTransform();
        }
    }, { passive: false });

    canvasContainer.addEventListener('touchend', e => {
        if (e.touches.length < 2) { S.touchState.active = false; S.touchState.lastDist = 0; }
    });
}

import { useEffect, type RefObject } from "react";

/** Pixels the mouse must travel before a press counts as a drag instead of a click. */
const DRAG_THRESHOLD = 5;

/**
 * Click-and-hold horizontal scrolling with the mouse.
 * Touch and pen are left alone: browsers already swipe-scroll those natively.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let start: { x: number; left: number; pointerId: number } | null = null;
    let dragged = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      start = { x: e.clientX, left: el.scrollLeft, pointerId: e.pointerId };
      dragged = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.pointerId) return;
      const dx = e.clientX - start.x;
      if (!dragged) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        dragged = true;
        el.setPointerCapture(e.pointerId);
        el.classList.add("is-dragging");
      }
      el.scrollLeft = start.left - dx;
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.pointerId) return;
      start = null;
      el.classList.remove("is-dragging");
    };

    // The click that ends a drag must not open a day or an entry.
    const onClickCapture = (e: MouseEvent) => {
      if (!dragged) return;
      dragged = false;
      e.stopPropagation();
      e.preventDefault();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerEnd);
    el.addEventListener("pointercancel", onPointerEnd);
    el.addEventListener("click", onClickCapture, true);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerEnd);
      el.removeEventListener("pointercancel", onPointerEnd);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [ref]);
}

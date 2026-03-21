"use client";

import { useEffect } from "react";

/**
 * Shared scroll lock with reference counting.
 * Multiple overlays can independently request lock;
 * body scroll is only restored when ALL locks are released.
 */
let lockCount = 0;
let previousHtmlOverflow = "";
let previousBodyOverflow = "";
let previousBodyOverscrollBehavior = "";

function lock() {
  lockCount++;
  if (lockCount === 1) {
    previousHtmlOverflow = document.documentElement.style.overflow;
    previousBodyOverflow = document.body.style.overflow;
    previousBodyOverscrollBehavior = document.body.style.overscrollBehavior;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";
  }
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.style.overflow = previousHtmlOverflow;
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.overscrollBehavior = previousBodyOverscrollBehavior;
  }
}

/** Lock body scroll while `active` is true. Ref-counted so multiple overlays work correctly. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return () => unlock();
  }, [active]);
}

"use client";

import { useEffect } from "react";

/**
 * Shared scroll lock with reference counting.
 * Multiple overlays can independently request lock;
 * body scroll is only restored when ALL locks are released.
 */
let lockCount = 0;

function lock() {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = "hidden";
  }
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = "";
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

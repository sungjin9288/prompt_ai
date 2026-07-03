"use client";

import { useEffect, useState } from "react";
import { setAnnounceListener } from "@/lib/browser/announcer";

const ZERO_WIDTH_SPACE = "​";

export function LiveAnnouncer() {
  const [state, setState] = useState({ message: "", nonce: 0 });

  useEffect(() => {
    setAnnounceListener((message) => {
      setState((prev) => ({ message, nonce: prev.nonce + 1 }));
    });

    return () => setAnnounceListener(null);
  }, []);

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {state.message}
      {ZERO_WIDTH_SPACE.repeat(state.nonce % 2)}
    </div>
  );
}

import { afterEach, describe, expect, it, vi } from "vitest";

import { announce, setAnnounceListener } from "@/lib/browser/announcer";

describe("announcer", () => {
  afterEach(() => {
    setAnnounceListener(null);
  });

  it("forwards announced messages to the registered listener", () => {
    const listener = vi.fn();
    setAnnounceListener(listener);

    announce("클립보드에 복사했습니다.");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("클립보드에 복사했습니다.");
  });

  it("does nothing when no listener is registered", () => {
    setAnnounceListener(null);

    expect(() => announce("무시되는 메시지")).not.toThrow();
  });

  it("only calls the most recently registered listener", () => {
    const first = vi.fn();
    const second = vi.fn();
    setAnnounceListener(first);
    setAnnounceListener(second);

    announce("최근 리스너만 호출");

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("최근 리스너만 호출");
  });

  it("stops announcing after the listener is cleared", () => {
    const listener = vi.fn();
    setAnnounceListener(listener);
    setAnnounceListener(null);

    announce("클리어 후 메시지");

    expect(listener).not.toHaveBeenCalled();
  });
});

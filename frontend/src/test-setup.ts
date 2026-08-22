import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Registers the jest-dom matchers (toBeInTheDocument, toBeDisabled, ...) on Vitest's expect.
import "@testing-library/jest-dom/vitest";

// Testing Library only auto-registers cleanup when Vitest's globals are enabled, and
// this project imports its test helpers explicitly instead. Without this, DOM from a
// finished test lingers and wins duplicate id/label lookups in the next one.
afterEach(cleanup);

function createMemoryStorage(): Storage {
  let entries = new Map<string, string>();

  return {
    get length() {
      return entries.size;
    },
    clear: () => {
      entries = new Map();
    },
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key: string) => {
      entries.delete(key);
    },
    setItem: (key: string, value: string) => {
      entries.set(key, String(value));
    },
  } as Storage;
}

// Node 26 ships an experimental global localStorage that needs --localstorage-file, and
// it shadows jsdom's: the property is present on window but its getter yields undefined
// (sessionStorage is unaffected). An in-memory Storage keeps tests off that interaction.
if (typeof window !== "undefined" && typeof window.localStorage === "undefined") {
  const storage = createMemoryStorage();

  Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
}

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Bersihkan DOM setelah tiap test (RTL tidak auto-cleanup tanpa globals).
afterEach(() => {
  cleanup();
});

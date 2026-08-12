import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConsentGate } from "./ConsentGate";
import { CONSENT_KEY } from "@/lib/consent";

const SCRIPTS = <div>analytics-scripts-mount</div>;

describe("SEC-004 — ConsentGate", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("unknown → banner tampil, script TIDAK dimuat", () => {
    render(<ConsentGate>{SCRIPTS}</ConsentGate>);
    expect(screen.getByRole("region", { name: "Persetujuan cookie" })).toBeInTheDocument();
    expect(screen.queryByText("analytics-scripts-mount")).not.toBeInTheDocument();
  });

  it("accepted (sudah pernah pilih) → script dimuat tanpa banner", () => {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    render(<ConsentGate>{SCRIPTS}</ConsentGate>);
    expect(screen.getByText("analytics-scripts-mount")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("rejected (sudah pernah pilih) → tidak ada script maupun banner", () => {
    window.localStorage.setItem(CONSENT_KEY, "rejected");
    render(<ConsentGate>{SCRIPTS}</ConsentGate>);
    expect(screen.queryByText("analytics-scripts-mount")).not.toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("klik Terima → consent tersimpan & script dimuat", async () => {
    render(<ConsentGate>{SCRIPTS}</ConsentGate>);
    fireEvent.click(screen.getByRole("button", { name: "Terima" }));
    await waitFor(() => expect(window.localStorage.getItem(CONSENT_KEY)).toBe("accepted"));
    await waitFor(() => expect(screen.getByText("analytics-scripts-mount")).toBeInTheDocument());
  });

  it("klik Tolak → consent tersimpan & script TIDAK dimuat (DoD: 0 request vendor)", async () => {
    render(<ConsentGate>{SCRIPTS}</ConsentGate>);
    fireEvent.click(screen.getByRole("button", { name: "Tolak" }));
    await waitFor(() => expect(window.localStorage.getItem(CONSENT_KEY)).toBe("rejected"));
    await waitFor(() => {
      expect(screen.queryByText("analytics-scripts-mount")).not.toBeInTheDocument();
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
    });
  });
});

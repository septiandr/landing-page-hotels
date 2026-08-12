import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Faq } from "./Faq";
import type { FaqItem } from "@/generated/prisma/client";

const items = [
  { id: "f1", question: "Bagaimana cara memesan?", answer: "Gunakan widget booking.", category: "BOOKING", sortOrder: 1 },
  { id: "f2", question: "Apakah sarapan termasuk?", answer: "Sebagian besar rate sudah termasuk.", category: "HOTEL", sortOrder: 1 },
] as unknown as FaqItem[];

describe("TEST-003 — Faq (accordion)", () => {
  it("merender pertanyaan & jawaban tersembunyi awalnya", () => {
    render(<Faq items={items} />);
    const btn = screen.getByRole("button", { name: "Bagaimana cara memesan?" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Gunakan widget booking.")).not.toBeVisible();
  });

  it("klik membuka panel (aria-expanded true) & konten tampil", async () => {
    const user = userEvent.setup();
    render(<Faq items={items} />);
    await user.click(screen.getByRole("button", { name: "Bagaimana cara memesan?" }));
    expect(screen.getByRole("button", { name: "Bagaimana cara memesan?" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Gunakan widget booking.")).toBeVisible();
  });

  it("klik lagi menutup panel (accordion single-open)", async () => {
    const user = userEvent.setup();
    render(<Faq items={items} />);
    const btn = screen.getByRole("button", { name: "Bagaimana cara memesan?" });
    await user.click(btn);
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });
});

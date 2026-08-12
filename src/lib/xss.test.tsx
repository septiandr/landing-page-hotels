import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Faq } from "@/components/landing/Faq";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";

// SEC-002 — Payload jahat yang mungkin dimasukkan via CMS.
const XSS_SCRIPT = `<script>alert('xss')</script>`;
const XSS_IMG = `<img src=x onerror=alert(1)>`;

describe("SEC-002 — XSS protection (konten CMS dirender sebagai teks)", () => {
  it("FAQ question/answer tidak dieksekusi", () => {
    const faq = {
      id: "f1",
      question: `Q? ${XSS_SCRIPT}`,
      answer: XSS_IMG,
      category: "BOOKING",
      sortOrder: 1,
    } as never;
    render(<Faq items={[faq]} />);

    // Tampil sebagai teks polos (React escape), bukan elemen.
    expect(screen.getByText(`Q? ${XSS_SCRIPT}`)).toBeInTheDocument();
    expect(screen.getByText(XSS_IMG)).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("<script>alert");
    expect(document.body.innerHTML).not.toContain("<img src=x");
  });

  it("testimonial review tidak dieksekusi", () => {
    const t = {
      id: "t1",
      guestName: "Hacker",
      country: "ID",
      rating: 5,
      review: XSS_SCRIPT,
      source: "Google",
      publishedAt: new Date("2026-01-01"),
    } as never;
    render(<TestimonialCarousel testimonials={[t]} />);

    // Blockquote membungkus review dengan tanda kutip — cek via textContent.
    expect(document.body.textContent).toContain(XSS_SCRIPT);
    expect(document.body.innerHTML).not.toContain("<script>alert");
  });
});

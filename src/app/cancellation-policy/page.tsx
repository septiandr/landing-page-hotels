import { LegalPage } from "@/components/landing/LegalPage";

export const metadata = {
  title: "Cancellation Policy",
};

export default function CancellationPolicyPage() {
  return (
    <LegalPage
      title="Cancellation Policy"
      sections={[
        "[Template] Kebijakan pembatalan reservasi. Contoh: pembatalan gratis hingga 24 jam sebelum check-in, biaya satu malam untuk pembatalan mendadak atau no-show.",
        "[Template] Penawaran khusus (promo) mungkin memiliki ketentuan pembatalan berbeda — periksa saat memesan atau hubungi hotel.",
      ]}
    />
  );
}

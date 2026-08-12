import { LegalPage } from "@/components/landing/LegalPage";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      sections={[
        "[Template] Ketentuan penggunaan website dan layanan pemesanan hotel. Bagian ini menjelaskan hak & kewajiban tamu saat mengakses situs dan melakukan reservasi.",
        "[Template] Semua tarif dan ketersediaan dapat berubah sewaktu-waktu. Pemesanan dianggap sah setelah konfirmasi diterima melalui booking engine atau tim hotel.",
        "[Template] Hubungi tim hotel untuk pertanyaan terkait ketentuan ini.",
      ]}
    />
  );
}

import { LegalPage } from "@/components/landing/LegalPage";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      sections={[
        "[Template] Kebijakan privasi pengguna website. Jelaskan data apa yang dikumpulkan (mis. data reservasi, cookies/analytics), untuk apa digunakan, dan bagaimana disimpan.",
        "[Template] Data reservasi diproses oleh booking engine pihak ketiga (Cloudbeds) sesuai kebijakan privasi masing-masing.",
        "[Template] Hubungi hotel untuk mengakses, mengoreksi, atau menghapus data pribadi Anda.",
      ]}
    />
  );
}

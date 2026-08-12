import {
  BadgePercent,
  CalendarCheck2,
  Clock3,
  Coffee,
  Gift,
  Sparkles,
  Wine,
  type LucideIcon,
} from "lucide-react";

/** Mapping nama ikon dari CMS (field `icon`) ke komponen lucide. */
export const BENEFIT_ICONS: Record<string, LucideIcon> = {
  BadgePercent,
  CalendarCheck2,
  Clock3,
  Coffee,
  Gift,
  Wine,
};

/** Ikon fallback jika nama di CMS tidak dikenal. */
export function getBenefitIcon(name?: string | null): LucideIcon {
  if (name && BENEFIT_ICONS[name]) return BENEFIT_ICONS[name];
  return Sparkles;
}

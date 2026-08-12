import {
  BadgePercent,
  BedDouble,
  CalendarCheck2,
  Car,
  Clock3,
  Coffee,
  Dumbbell,
  Flower2,
  Gift,
  Hotel,
  Plane,
  Presentation,
  Refrigerator,
  Shield,
  Snowflake,
  Sparkles,
  Tv,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
  Wine,
  type LucideIcon,
} from "lucide-react";

/** Mapping nama ikon dari CMS (field `icon`) ke komponen lucide. */
export const ICONS: Record<string, LucideIcon> = {
  BadgePercent,
  BedDouble,
  CalendarCheck2,
  Car,
  Clock3,
  Coffee,
  Dumbbell,
  Flower2,
  Gift,
  Hotel,
  Plane,
  Presentation,
  Refrigerator,
  Shield,
  Snowflake,
  Tv,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
  Wine,
};

/** Ikon fallback jika nama di CMS tidak dikenal. */
export function getIcon(name?: string | null): LucideIcon {
  if (name && ICONS[name]) return ICONS[name];
  return Sparkles;
}

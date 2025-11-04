// Color mapping for primary categories
export const categoryColors = {
  museum: {
    marker: "text-blue-500",
    markerFill: "fill-blue-500",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    badgeDark: "dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  library: {
    marker: "text-purple-500",
    markerFill: "fill-purple-500",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    badgeDark: "dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  },
  memorial: {
    marker: "text-amber-500",
    markerFill: "fill-amber-500",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    badgeDark: "dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  },
  archive: {
    marker: "text-emerald-500",
    markerFill: "fill-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badgeDark: "dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
} as const;

export type PrimaryCategoryId = keyof typeof categoryColors;

export function getCategoryColor(categoryId: string) {
  const colors = categoryColors[categoryId as PrimaryCategoryId];
  return colors || categoryColors.museum; // Default to museum colors
}

export function getCategoryMarkerClass(categoryId: string, isSelected: boolean = false) {
  const colors = getCategoryColor(categoryId);
  if (isSelected) {
    return `${colors.marker} ${colors.markerFill} scale-125`;
  }
  return `${colors.marker} ${colors.markerFill} group-hover:scale-110`;
}

export function getCategoryBadgeClass(categoryId: string) {
  const colors = getCategoryColor(categoryId);
  return `${colors.badge} ${colors.badgeDark} border`;
}

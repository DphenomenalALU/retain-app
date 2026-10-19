import type { ExpenseCategory } from "../types/retain";

type CategoryColors = { foreground: string; background: string; border: string };

const crmCategoryPalette: Record<string, CategoryColors> = {
  cat_001: { foreground: "var(--tag-orange-text)", background: "var(--tag-orange-bg)", border: "var(--tag-orange-border)" },
  cat_002: { foreground: "var(--tag-blue-text)", background: "var(--tag-blue-bg)", border: "var(--tag-blue-border)" },
  cat_003: { foreground: "var(--tag-purple-text)", background: "var(--tag-purple-bg)", border: "var(--tag-purple-border)" },
  cat_004: { foreground: "var(--tag-green-text)", background: "var(--tag-green-bg)", border: "var(--tag-green-border)" },
  cat_005: { foreground: "var(--tag-neutral-text)", background: "var(--tag-neutral-bg)", border: "var(--tag-neutral-border)" },
};

export function categoryColors(category?: Pick<ExpenseCategory, "id" | "color"> | null): CategoryColors {
  if (!category) return { foreground: "var(--tag-neutral-text)", background: "var(--tag-neutral-bg)", border: "var(--tag-neutral-border)" };
  return crmCategoryPalette[category.id] ?? { foreground: category.color, background: `${category.color}1c`, border: "var(--line-strong)" };
}

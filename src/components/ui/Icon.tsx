export type IconName = "grid" | "users" | "receipt" | "wallet" | "shield" | "plus" | "menu" | "bell" | "arrow" | "trend" | "close" | "search" | "chevron" | "more" | "logout" | "calendar" | "edit" | "utensils" | "car" | "house" | "heart" | "bag" | "plane" | "book" | "gift" | "bolt" | "phone" | "music" | "briefcase" | "paw" | "camera" | "coffee" | "sun" | "tag" | "chart" | "repeat" | "sparkle";

export const iconCatalog: Array<{ name: IconName; label: string }> = [
  { name: "utensils", label: "Food" }, { name: "car", label: "Transport" }, { name: "house", label: "Home" }, { name: "heart", label: "Health" },
  { name: "bag", label: "Shopping" }, { name: "plane", label: "Travel" }, { name: "book", label: "Learning" }, { name: "gift", label: "Gifts" },
  { name: "bolt", label: "Utilities" }, { name: "phone", label: "Phone" }, { name: "music", label: "Music" }, { name: "briefcase", label: "Work" },
  { name: "paw", label: "Pets" }, { name: "camera", label: "Photography" }, { name: "coffee", label: "Coffee" }, { name: "sun", label: "Leisure" },
  { name: "wallet", label: "Money" }, { name: "receipt", label: "Bills" }, { name: "tag", label: "Tag" }, { name: "chart", label: "Investing" },
  { name: "repeat", label: "Recurring" }, { name: "sparkle", label: "Other" },
];

const iconNames = new Set(iconCatalog.map((icon) => icon.name));
export function getIconName(value?: string): IconName { return value && iconNames.has(value as IconName) ? value as IconName : "receipt"; }
const paths: Record<IconName, string> = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  users: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5-5a2.5 2.5 0 0 1 0 5M16 15h1.5a3.5 3.5 0 0 1 3.5 3.5V20",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h4",
  wallet: "M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9ZM4 8h15M15.5 12H20v4h-4.5a2 2 0 1 1 0-4Z",
  shield: "M12 3 20 6v5c0 5.1-3.4 8.7-8 10-4.6-1.3-8-4.9-8-10V6l8-3Zm-3 9 2 2 4-4",
  plus: "M12 5v14M5 12h14", menu: "M4 7h16M4 12h16M4 17h16",
  bell: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8ZM10 21h4",
  search: "m20 20-4.3-4.3M10.8 17a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4Z",
  arrow: "M5 12h14M13 6l6 6-6 6", trend: "M4 17 9 12l3 3 7-8M15 7h4v4", close: "m6 6 12 12M18 6 6 18",
  chevron: "m7 9 5 5 5-5", more: "M5 12h.01M12 12h.01M19 12h.01", logout: "M10 17l5-5-5-5M15 12H4M20 4v16", calendar: "M5 5h14v16H5zM8 3v4M16 3v4M5 10h14", edit: "M4 20l4-1L19 8l-3-3L5 16l-1 4Z",
  utensils: "M7 3v8M10 3v8M7 7h3M8.5 11v10M16 3c0 4 0 5 2 7v11M16 3v8",
  car: "M5 17h14M6 17v3M18 17v3M4 13l2-6h12l2 6M4 13h16v4H4zM7 14h.01M17 14h.01",
  house: "m3 11 9-7 9 7M5 10v10h14V10M9 20v-6h6v6",
  heart: "M20.8 8.9c0 5.6-8.8 10.1-8.8 10.1S3.2 14.5 3.2 8.9A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 8.8 2.9Z",
  bag: "M5 8h14l-1 12H6L5 8Zm3 0V6a4 4 0 0 1 8 0v2",
  plane: "M3 12h18M12 3v18M5 7l7 5-7 5M19 7l-7 5 7 5",
  book: "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4 0V4Zm0 0v12",
  gift: "M4 10h16v10H4V10Zm0 0h16M12 10v10M3 6h18v4H3V6Zm9 0H8.5A2.5 2.5 0 1 1 11 3.5c1 0 1 2.5 1 2.5Zm0 0h3.5A2.5 2.5 0 1 0 13 3.5c-1 0-1 2.5-1 2.5Z",
  bolt: "m13 2-9 12h7l-1 8 9-12h-7l1-8Z",
  phone: "M7 3h3l1.5 4-2 1.5a14 14 0 0 0 5 5L16 11l4 1.5v3A2.5 2.5 0 0 1 17.5 18C10 18 6 14 6 6.5A2.5 2.5 0 0 1 7 3Z",
  music: "M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z",
  briefcase: "M4 8h16v12H4V8Zm4 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 12h16M10 12v2h4v-2",
  paw: "M8 10c-2 0-3-2-3-3.5S6 4 7.5 4 10 5.5 10 7s-.9 3-2 3Zm8 0c-1.1 0-2-1.5-2-3s1-3 2.5-3S19 5 19 6.5 18 10 16 10Zm-4 1c-2.8 0-5 3.4-5 5.5S8.8 20 12 20s5-1.4 5-3.5S14.8 11 12 11Z",
  camera: "M4 7h4l1.5-2h5L16 7h4v12H4V7Zm8 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z",
  coffee: "M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Zm11 2h2a3 3 0 0 1 0 6h-2M8 4v2M12 4v2",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  tag: "m4 4 8 0 8 8-8 8-8-8V4Zm4 4h.01",
  chart: "M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6M20 16V3",
  repeat: "M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3",
  sparkle: "m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z",
};
export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return <svg aria-hidden="true" className={className} fill="none" height={size} viewBox="0 0 24 24" width={size}><path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

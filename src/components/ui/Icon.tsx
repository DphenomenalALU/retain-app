type IconName = "grid" | "receipt" | "wallet" | "shield" | "plus" | "menu" | "bell" | "arrow" | "trend" | "close";
const paths: Record<IconName, string> = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h4",
  wallet: "M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9ZM4 8h15M15.5 12H20v4h-4.5a2 2 0 1 1 0-4Z",
  shield: "M12 3 20 6v5c0 5.1-3.4 8.7-8 10-4.6-1.3-8-4.9-8-10V6l8-3Zm-3 9 2 2 4-4",
  plus: "M12 5v14M5 12h14", menu: "M4 7h16M4 12h16M4 17h16",
  bell: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8ZM10 21h4",
  arrow: "M5 12h14M13 6l6 6-6 6", trend: "M4 17 9 12l3 3 7-8M15 7h4v4", close: "m6 6 12 12M18 6 6 18",
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}><path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

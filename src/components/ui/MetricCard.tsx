import { Icon } from "./Icon";
type MetricCardProps = { label: string; value: string; detail: string; tone?: "mint" | "sand" | "lilac" | "peach" };
export default function MetricCard({ label, value, detail, tone = "mint" }: MetricCardProps) {
  return <article className={`metric-card metric-card--${tone}`}><div className="metric-card__topline"><span>{label}</span><Icon name="trend" size={17} /></div><strong>{value}</strong><p>{detail}</p></article>;
}

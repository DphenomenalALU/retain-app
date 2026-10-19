import { Icon } from "./Icon";
import type { IconName } from "./Icon";
type MetricCardProps = { label: string; value: string; detail: string; tone?: "mint" | "sand" | "lilac" | "peach"; icon?: IconName; showIcon?: boolean };
export default function MetricCard({ label, value, detail, tone = "mint", icon = "trend", showIcon = true }: MetricCardProps) {
  return <article className={`metric-card metric-card--${tone}`}>
    <div className="metric-card__topline"><span>{label}</span></div>
    <div className="metric-card__value">{showIcon && <span className="metric-card__icon"><Icon name={icon} size={18} /></span>}<strong>{value}</strong></div>
    <p>{detail}</p>
  </article>;
}

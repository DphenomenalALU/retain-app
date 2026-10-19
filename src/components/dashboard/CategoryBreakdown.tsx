import type { DashboardSummary } from "../../types/retain";
import { categoryColors } from "../../data/categoryPalette";
import { getIconName, Icon } from "../ui/Icon";
import { Link } from "react-router-dom";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
type CategoryBreakdownProps = { rows: DashboardSummary["byCategory"]; total: number };

export default function CategoryBreakdown({ rows, total }: CategoryBreakdownProps) {
  return <aside aria-labelledby="category-breakdown-title" className="dashboard-side"><div className="section-heading dashboard-side__heading"><h2 id="category-breakdown-title">Spending by category</h2><Link className="text-link" to="/expenses">View all <Icon name="arrow" size={14} /></Link></div><div className="panel dashboard-side__panel">{rows.length ? <div className="category-list">{rows.map(({ category, total: amount }) => { const palette = categoryColors(category); const share = total ? Math.round((amount / total) * 100) : 0; const maxAmount = rows[0]?.total ?? amount; return <div className="category-row" key={category.id}><div className="category-row__top"><span className="category-row-icon" style={{ color: palette.foreground, background: palette.background, border: `1px solid ${palette.border}` }}><Icon name={getIconName(category.icon)} size={15} /></span><span className="category-name">{category.name}</span><span className="category-percent">{share}%</span><strong className="category-amount">{money.format(amount)}</strong></div><div className="category-bar"><span style={{ width: `${(amount / maxAmount) * 100}%`, background: palette.foreground }} /></div></div>; })}</div> : <div className="empty-state"><strong>No spending yet</strong><span>Add your first expense to see the month take shape.</span></div>}</div></aside>;
}

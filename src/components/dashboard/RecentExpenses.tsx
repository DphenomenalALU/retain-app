import type { Expense } from "../../types/retain";
import { getIconName, Icon } from "../ui/Icon";
import { Link } from "react-router-dom";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
type RecentExpensesProps = { expenses: Expense[]; onOpen: (expense: Expense) => void };

export default function RecentExpenses({ expenses, onOpen }: RecentExpensesProps) {
  return <section className="panel recent-panel"><div className="panel-heading"><div><h3>Recent expenses</h3></div><Link className="button button--quiet" to="/expenses">See all <Icon name="arrow" size={15} /></Link></div>{expenses.length ? <><div aria-hidden="true" className="expense-list__header"><span /><span>Date</span><span>Amount</span><span /></div><div className="expense-list">{expenses.slice(0, 4).map((expense) => <div className="expense-row" key={expense.id}><button aria-label={`Open details for ${expense.title}`} className="expense-row__open" onClick={() => onOpen(expense)} type="button"><span className="expense-icon" style={{ color: expense.category.color, background: `${expense.category.color}1c` }}><Icon name={getIconName(expense.category.icon)} size={18} /></span><span className="expense-title"><strong>{expense.title}</strong><span>{expense.category.name} · {expense.paymentMethod}</span></span></button><time dateTime={expense.date}>{new Date(`${expense.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time><strong className="expense-amount">{money.format(expense.amount)}</strong><button aria-label={`Open details for ${expense.title}`} className="row-menu" onClick={() => onOpen(expense)} type="button"><Icon name="more" size={17} /></button></div>)}</div></> : <div className="empty-state"><strong>Your recent activity will appear here.</strong><span>Start by adding an expense.</span></div>}</section>;
}

import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <main className="not-found"><p className="eyebrow">404 · Not found</p><h1>We couldn’t find that page.</h1><p className="page-lede">The link may be old, or the page may have moved.</p><Link className="button button--primary" to="/">Back to overview</Link></main>;
}

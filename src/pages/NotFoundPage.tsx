import { Link } from "react-router-dom";
export default function NotFoundPage() { return <main className="not-found"><p className="eyebrow">404</p><h1>That page wandered off.</h1><p className="page-lede">Let’s take you back to your overview.</p><Link className="button button--primary" to="/">Back to overview</Link></main>; }

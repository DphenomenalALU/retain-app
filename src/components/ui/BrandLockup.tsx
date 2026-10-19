export default function BrandLockup({ onDark = false }: { onDark?: boolean }) {
  return <div className={`brand-lockup${onDark ? " brand-lockup--on-dark" : ""}`}>
    <span aria-hidden="true" className="brand-mark">
      <svg fill="none" height="24" viewBox="0 0 24 24" width="24"><path d="M4 16.5c3.6-2.9 6.7-3.1 9.6-1.1 2.2 1.5 4.1 1.2 6.4-1.4M4 11.8c3.6-2.9 6.7-3.1 9.6-1.1 2.2 1.5 4.1 1.2 6.4-1.4M4 7.2c3.6-2.9 6.7-3.1 9.6-1.1 2.2 1.5 4.1 1.2 6.4-1.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>
    </span>
    <span className="brand-copy"><strong>Retain</strong></span>
  </div>;
}

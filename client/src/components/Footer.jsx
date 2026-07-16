export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <span className="footer-brand">Depressd 💙</span>
      <span className="footer-copy">
        © {year} · Copyright by <strong>Raihan Rimon</strong> — Author of this web app
      </span>
    </footer>
  );
}

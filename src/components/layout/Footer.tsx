export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 pb-24 md:pb-6 text-center text-xs text-emerald-800/60">
      © {year} Sappy Stationary • Designed & Developed by <a href="https://sappyshop.site" className="underline">Sappy Studio</a>
    </footer>
  );
}
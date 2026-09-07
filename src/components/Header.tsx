import Link from "next/link";
import { Icon } from "./Icon";

export function Header({ active = "explore" }: { active?: "explore" | "study" | "about" }) {
  return <header className="site-header">
    <Link href="/" className="brand" aria-label="Sanctuary360 — início">
      <span className="brand-mark"><Icon name="sanctuary" size={26} /></span>
      <span>Sanctuary<span className="brand-number">360</span><small>ESPAÇO PARA COMPREENDER</small></span>
    </Link>
    <nav aria-label="Navegação principal" className="main-nav">
      <Link href="/" aria-current={active === "explore" ? "page" : undefined}>Explorar</Link>
      <Link href="/estudo" aria-current={active === "study" ? "page" : undefined}>Guia de estudo</Link>
      <Link href="/sobre" aria-current={active === "about" ? "page" : undefined}>Sobre o projeto</Link>
    </nav>
    <span className="header-note"><span className="status-dot" /> PROTÓTIPO EDUCACIONAL</span>
  </header>;
}

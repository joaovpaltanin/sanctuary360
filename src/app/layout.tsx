import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sanctuary360 | Explore o Tabernáculo", template: "%s | Sanctuary360" },
  description: "Explore uma reconstrução didática do Tabernáculo do deserto em 3D, com referências bíblicas e interpretação adventista identificada. Protótipo para revisão.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a>{children}</body></html>;
}

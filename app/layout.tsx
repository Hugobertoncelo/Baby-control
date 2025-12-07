import { Inter as FontSans } from "next/font/google";
import { cn } from "@/src/lib/utils";
import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://www.baby-control.com"
      : "http://localhost:3000"
  ),
  title: "Baby Control",
  icons: {
    icon: "/sprout-128.png",
    shortcut: "/sprout-128.png",
    apple: "/sprout-128.png",
  },
  description:
    "Acompanhe o sono, alimentação, fraldas, marcos e muito mais do seu bebê com nossa plataforma intuitiva e familiar. Simples de usar, focada em privacidade, acessível de qualquer lugar. Experimente grátis por 14 dias!",
  keywords: [
    "controle de bebê",
    "aplicativo de acompanhamento de bebê",
    "cuidados com recém-nascido",
    "rastreador de alimentação de bebê",
    "rastreador de sono de bebê",
    "rastreador de fraldas",
    "marcos do bebê",
    "aplicativo para família",
    "coordenação de cuidadores",
    "atividades do bebê",
    "ferramentas para pais",
  ],
  authors: [{ name: "Hugo Bertoncelo" }],
  creator: "Hugo Bertoncelo",
  publisher: "Hugo Bertoncelo",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.baby-control.com",
    title: "Baby Control - O Controle Compartilhável do Bebê",
    description:
      "Acompanhe o sono, alimentação, fraldas, marcos e muito mais do seu bebê com nossa plataforma intuitiva e familiar. Simples de usar, focada em privacidade, acessível de qualquer lugar.",
    siteName: "Baby Control",
    images: [
      {
        url: "/sprout-256.png",
        width: 256,
        height: 256,
        alt: "Logo Baby Control - App de Controle de Bebê",
      },
    ],
  },
  verification: {
    google: "",
  },
  alternates: {
    canonical: "https://www.baby-control.com",
  },
  category: "tecnologia",
};

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={cn("h-full", fontSans.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "min-h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans antialiased"
        )}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

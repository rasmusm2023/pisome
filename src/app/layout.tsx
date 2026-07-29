import type { Metadata } from "next";
import { Onest, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Onest({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Pisome — Spanish homes with Nordic clarity",
    template: "%s · Pisome",
  },
  description:
    "Search and list homes in Spain with a clean, fast, Scandinavian-inspired experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

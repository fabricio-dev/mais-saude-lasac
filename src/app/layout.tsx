import "./globals.css";

import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { LegacySupportScript } from "@/components/legacy-support-script";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mais Saúde Lasac",
  description: "Sistema de Gestão de convênios Mais Saúde Lasac",
  keywords: ["Mais Saúde Lasac", "convênios", "gestão", "sistema"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <LegacySupportScript />
      </head>
      <body className={`${manrope.variable} antialiased`}>
        <NuqsAdapter>{children}</NuqsAdapter>

        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}

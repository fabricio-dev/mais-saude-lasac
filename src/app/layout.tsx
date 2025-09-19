import "./globals.css";

import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { BrowserCompatibilityProvider } from "@/components/browser-compatibility-provider";

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
        {/* Polyfill para CSS Variables em navegadores antigos */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Detecção rápida de suporte a CSS Variables
              if (!window.CSS || !CSS.supports || !CSS.supports('color', 'var(--fake-var)')) {
                document.documentElement.className += ' no-css-variables';
              }
              
              // Detecção de Windows 7
              if (/Windows NT 6\\.1/.test(navigator.userAgent)) {
                document.documentElement.className += ' windows-7';
              }
              
              // Detecção de Internet Explorer
              if (/MSIE|Trident/.test(navigator.userAgent)) {
                document.documentElement.className += ' internet-explorer';
              }
            `,
          }}
        />
      </head>
      <body className={`${manrope.variable} antialiased`}>
        <BrowserCompatibilityProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster position="bottom-center" richColors />
        </BrowserCompatibilityProvider>
      </body>
    </html>
  );
}

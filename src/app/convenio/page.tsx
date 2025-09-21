"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { PublicPageContainer } from "@/components/ui/page-container";

import { ConvenioForm } from "./_components/convenio-form";
import ConvenioLegacy from "./page-legacy";

export default function ConvenioPage() {
  const [isLegacyBrowser, setIsLegacyBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Detectar navegadores antigos
  useEffect(() => {
    const detectLegacyBrowser = () => {
      const userAgent = navigator.userAgent;

      // Detectar Windows 7 - força uso da versão legacy
      const isWindows7 = /Windows NT 6\.1/.test(userAgent);
      if (isWindows7) {
        return true;
      }

      const isOldChrome =
        /Chrome\/([0-9]+)/.test(userAgent) &&
        parseInt(userAgent.match(/Chrome\/([0-9]+)/)![1]) < 110;
      const isOldFirefox =
        /Firefox\/([0-9]+)/.test(userAgent) &&
        parseInt(userAgent.match(/Firefox\/([0-9]+)/)![1]) < 100;
      const isOldSafari =
        /Version\/([0-9]+)/.test(userAgent) &&
        parseInt(userAgent.match(/Version\/([0-9]+)/)![1]) < 15;
      const isIE = /MSIE|Trident/.test(userAgent);
      const isOldEdge =
        /Edge\/([0-9]+)/.test(userAgent) &&
        parseInt(userAgent.match(/Edge\/([0-9]+)/)![1]) < 90;

      return isOldChrome || isOldFirefox || isOldSafari || isIE || isOldEdge;
    };

    setIsLegacyBrowser(detectLegacyBrowser());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-600 to-emerald-500">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (isLegacyBrowser) {
    return <ConvenioLegacy />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-600 to-emerald-500">
      {/* Header */}
      <header className="bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Image
                  src="/logo03.svg"
                  alt="Mais Saúde Lasac Logo"
                  width={40}
                  height={30}
                  className="h-8 w-auto object-contain"
                />
                <h1 className="text-xl font-bold text-emerald-900">
                  Mais Saúde Lasac
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <PublicPageContainer>
        <Suspense
          fallback={
            <div className="flex justify-center py-8">Carregando...</div>
          }
        >
          <ConvenioForm />
        </Suspense>
      </PublicPageContainer>
    </div>
  );
}

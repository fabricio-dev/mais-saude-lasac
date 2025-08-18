"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";

import { ConvenioForm } from "./_components/convenio-form";

export default function ConvenioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-100 to-teal-200">
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

      <PageContainer>
        <Suspense
          fallback={
            <div className="flex justify-center py-8">Carregando...</div>
          }
        >
          <ConvenioForm />
        </Suspense>
      </PageContainer>
    </div>
  );
}

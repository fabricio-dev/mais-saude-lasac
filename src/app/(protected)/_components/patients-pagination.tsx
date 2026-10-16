"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

interface PatientsPaginationProps {
  currentPage: number;
  totalPages: number;
}

/**
 * Botões de paginação das listagens de pacientes.
 * A página vai no parâmetro "page" da URL, preservando busca e filtros,
 * e o servidor busca só os pacientes daquela página.
 */
const PatientsPagination = ({
  currentPage,
  totalPages,
}: PatientsPaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = (page: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (page > 1) {
        params.set("page", String(page));
      } else {
        params.delete("page");
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={isPending || currentPage <= 1}
      >
        Anterior
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={isPending || currentPage >= totalPages}
      >
        Próxima
      </Button>
    </div>
  );
};

export default PatientsPagination;

"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

import ListExpiredButton from "./list-expired-button";

const FiltersBar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);

    startTransition(() => {
      const params = new URLSearchParams(searchParams);

      if (from.trim()) {
        params.set("dateFrom", from.trim());
      } else {
        params.delete("dateFrom");
      }

      if (to.trim()) {
        params.set("dateTo", to.trim());
      } else {
        params.delete("dateTo");
      }

      router.push(`/gerente/patients-gestor?${params.toString()}`);
    });
  };

  const handleClearDateFilter = () => {
    setDateFrom("");
    setDateTo("");

    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.delete("dateFrom");
      params.delete("dateTo");
      router.push(`/gerente/patients-gestor?${params.toString()}`);
    });
  };

  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="flex items-center gap-2">
      <DatePicker
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={handleDateChange}
        placeholder="Filtrar por vencimento"
        className="w-auto"
      />

      {hasDateFilter && (
        <Button
          type="button"
          variant="outline"
          onClick={handleClearDateFilter}
          disabled={isPending}
          size="icon"
          title="Limpar filtro de data"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <ListExpiredButton />
    </div>
  );
};

export default FiltersBar;

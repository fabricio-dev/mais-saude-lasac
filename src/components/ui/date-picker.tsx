"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  dateFrom?: string;
  dateTo?: string;
  onDateChange?: (dateFrom: string, dateTo: string) => void;
  placeholder?: string;
}

export function DatePicker({
  className,
  dateFrom,
  dateTo,
  onDateChange,
  placeholder = "Selecionar período",
}: DatePickerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleDateSelect = (dateRange: DateRange | undefined) => {
    if (!dateRange?.from) {
      onDateChange?.("", "");
      return;
    }

    // Se não há 'to' definido (primeiro clique) ou se from e to são iguais (mesmo dia)
    if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
      // Para um único dia: from = início do dia, to = final do dia
      const fromStr = dayjs(dateRange.from)
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss");
      const toStr = dayjs(dateRange.from)
        .endOf("day")
        .format("YYYY-MM-DD HH:mm:ss");
      onDateChange?.(fromStr, toStr);
    } else {
      // Para intervalo: from = início do primeiro dia, to = final do último dia
      const fromDate = dayjs(dateRange.from).startOf("day");
      const toDate = dayjs(dateRange.to).endOf("day");

      onDateChange?.(
        fromDate.format("YYYY-MM-DD HH:mm:ss"),
        toDate.format("YYYY-MM-DD HH:mm:ss"),
      );
    }
  };

  const date = {
    from: dateFrom ? dayjs(dateFrom).toDate() : undefined,
    to: dateTo ? dayjs(dateTo).toDate() : undefined,
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal sm:w-auto",
              !date.from && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">
              {date?.from ? (
                date.to && date.from.getTime() !== date.to.getTime() ? (
                  <>
                    {format(date.from, "dd LLL, yy", {
                      locale: ptBR,
                    })}{" "}
                    -{" "}
                    {format(date.to, "dd LLL, yy", {
                      locale: ptBR,
                    })}
                  </>
                ) : (
                  format(date.from, "dd de LLL, yy", {
                    locale: ptBR,
                  })
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
            <span className="sm:hidden">
              {date?.from ? (
                date.to && date.from.getTime() !== date.to.getTime() ? (
                  <>
                    {format(date.from, "dd/MM", {
                      locale: ptBR,
                    })}{" "}
                    -{" "}
                    {format(date.to, "dd/MM", {
                      locale: ptBR,
                    })}
                  </>
                ) : (
                  format(date.from, "dd/MM/yy", {
                    locale: ptBR,
                  })
                )
              ) : (
                <span>Período</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={isMobile ? 1 : 2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

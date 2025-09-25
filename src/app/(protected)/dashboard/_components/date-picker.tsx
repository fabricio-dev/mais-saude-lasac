"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import dayjs from "dayjs";
import { Calendar as CalendarIcon } from "lucide-react";
import { parseAsIsoDate, useQueryState } from "nuqs";
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

export function DatePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const [isMobile, setIsMobile] = useState(false);
  const [from, setFrom] = useQueryState(
    "from",
    parseAsIsoDate.withDefault(dayjs().subtract(1, "month").toDate()),
  );
  const [to, setTo] = useQueryState(
    "to",
    parseAsIsoDate.withDefault(dayjs().toDate()),
  );

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleDateSelect = (dateRange: DateRange | undefined) => {
    if (!dateRange?.from) return;

    // console.log("Raw dateRange:", dateRange);

    // Se não há 'to' definido (primeiro clique)
    if (!dateRange.to) {
      //console.log("First click - setting both dates to:", dateRange.from);
      setFrom(dateRange.from, { shallow: false });
      setTo(dateRange.from, { shallow: false });
    } else {
      // console.log(
      //   "Range selected - from:",
      //   dateRange.from,
      //   "to:",
      //   dateRange.to,
      // );

      // Usar dayjs para garantir que as datas não sejam alteradas
      const fromDate = dayjs(dateRange.from).startOf("day");
      const toDate = dayjs(dateRange.to).startOf("day");

      // console.log("Setting from:", fromDate.format("YYYY-MM-DD"));
      // console.log("Setting to:", toDate.format("YYYY-MM-DD"));

      setFrom(fromDate.toDate(), { shallow: false });
      setTo(toDate.toDate(), { shallow: false });
    }
  };
  const date = {
    from: from ? dayjs(from).startOf("day").toDate() : undefined,
    to: to ? dayjs(to).startOf("day").toDate() : undefined,
  };

  // console.log("Display date object:", date);
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal sm:w-auto",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">
              {date?.from ? (
                date.to ? (
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
                  format(date.from, "dd de LLL, yy")
                )
              ) : (
                <span>Selecionar período</span>
              )}
            </span>
            <span className="sm:hidden">
              {date?.from ? (
                date.to ? (
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
                  format(date.from, "dd/MM/yy")
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

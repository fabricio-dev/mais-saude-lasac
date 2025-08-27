"use client";

import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
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
    parseAsIsoDate.withDefault(subMonths(new Date(), 1)),
  );
  const [to, setTo] = useQueryState(
    "to",
    parseAsIsoDate.withDefault(new Date()),
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
    if (dateRange?.from) {
      setFrom(dateRange.from, {
        shallow: false,
      });
    }
    if (dateRange?.to) {
      setTo(dateRange.to, {
        shallow: false,
      });
    }
  };
  const date = {
    from,
    to,
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

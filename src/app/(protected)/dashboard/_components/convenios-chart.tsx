"use client";
import "dayjs/locale/pt-br";

import dayjs from "dayjs";

dayjs.locale("pt-br");

import { DollarSign } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrencyInCents } from "@/helpers/currency";

const chartConfig = {
  novos: {
    label: "Novos",
    color: "#EE7177",
  },
  renovados: {
    label: "Renovados",
    color: "#10B981",
  },
} satisfies ChartConfig;

interface ConveniosChartProps {
  dailyConveniosData: {
    date: string;
    novos: number;
    renovados: number;
  }[];
}
export function ConveniosChart({ dailyConveniosData }: ConveniosChartProps) {
  const chartDays = Array.from({ length: 15 }).map((_, i) =>
    dayjs()
      .subtract(12 - i, "days")
      .format("YYYY-MM-DD"),
  );

  const chartData = chartDays.map((date) => {
    const dataForDay = dailyConveniosData.find((item) => item.date === date);
    return {
      date: dayjs(date).format("DD/MM"),
      fullDate: date,
      novos: Number(dataForDay?.novos || 0),
      renovados: Number(dataForDay?.renovados || 0),
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <DollarSign className="h-4 w-4" />
        <CardTitle>Convenios Novos / Renovados</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[195px]">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCurrencyInCents(value)}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const color = name === "renovados" ? "#10B981" : "#EE7177";
                    const label = name === "renovados" ? "Renovados" : "Novos";
                    return (
                      <>
                        <div
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-muted-foreground">{label}:</span>
                        <span className="font-semibold">
                          {value}{" "}
                          {Number(value) === 1 ? "convenio" : "convenios"}
                        </span>
                      </>
                    );
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return dayjs(payload[0].payload?.fullDate).format(
                        "DD/MM/YYYY (dddd)",
                      );
                    }
                    return label;
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="novos"
              stroke="var(--color-novos)"
              fill="var(--color-novos)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="renovados"
              stroke="var(--color-renovados)"
              fill="var(--color-renovados)"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

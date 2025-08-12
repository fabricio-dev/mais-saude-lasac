"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/helpers/currency";

interface FaturamentoData {
  month: string;
  faturamento: number;
  isWithinPeriod?: boolean;
}

interface FaturamentoChartProps {
  data: FaturamentoData[];
  isLoading?: boolean;
}

const chartConfig = {
  faturamento: {
    label: "Faturamento",
    color: "#10B981",
  },
} satisfies ChartConfig;

const FaturamentoChart = ({
  data,
  isLoading = false,
}: FaturamentoChartProps) => {
  // Verificar se há dados válidos
  const hasValidData =
    data && data.length > 0 && data.some((item) => item.faturamento > 0);

  // Preparar dados para o gráfico (apenas se houver dados válidos)
  const chartData = hasValidData
    ? data.map((item) => ({
        month: item.month,
        faturamento: item.faturamento,
        isWithinPeriod: item.isWithinPeriod,
        // Para compatibilidade com o sistema de cores do recharts
        fill: item.isWithinPeriod ? "#10B981" : "#9CA3AF",
      }))
    : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faturamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <div className="animate-pulse text-gray-500">
              Carregando dados...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasValidData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faturamento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-gray-500">
              Dados não encontrados para o período selecionado
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Versão para tela */}
        <div className="print:hidden">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => {
                      if (value === null || value === undefined) return null;
                      const isWithinPeriod = props?.payload?.isWithinPeriod;
                      const label = isWithinPeriod
                        ? "Faturamento (Período)"
                        : "Faturamento (Contexto)";
                      return [formatCurrency(Number(value)), label];
                    }}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                }
              />
              <Bar dataKey="faturamento" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isWithinPeriod ? "#10B981" : "#9CA3AF"}
                    opacity={entry.isWithinPeriod ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Versão para impressão - sem ChartContainer */}
        <div className="hidden h-[250px] w-full print:block">
          <BarChart
            width={600}
            height={250}
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Bar dataKey="faturamento" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isWithinPeriod ? "#10B981" : "#9CA3AF"}
                  opacity={entry.isWithinPeriod ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaturamentoChart;

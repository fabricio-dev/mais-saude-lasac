"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ConveniosVencidosRenovadosData {
  vencidos: number;
  renovados: number;
}

interface ConveniosVencidosRenovadosChartProps {
  data: ConveniosVencidosRenovadosData;
  isLoading?: boolean;
}

const chartConfig = {
  vencidos: {
    label: "Vencidos",
    color: "#dc2626",
  },
  renovados: {
    label: "Renovados",
    color: "#16a34a",
  },
} satisfies ChartConfig;

const ConveniosVencidosRenovadosChart = ({
  data,
  isLoading = false,
}: ConveniosVencidosRenovadosChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Convênios Vencidos vs Renovados</CardTitle>
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

  const total = data.vencidos + data.renovados;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Convênios Vencidos vs Renovados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-gray-500">Nenhum dado disponível</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      name: "Renovados",
      value: data.renovados,
      percentage: ((data.renovados / total) * 100).toFixed(1),
    },
    {
      name: "Vencidos",
      value: data.vencidos,
      percentage: ((data.vencidos / total) * 100).toFixed(1),
    },
  ];

  const COLORS = ["#16a34a", "#dc2626"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convênios Vencidos vs Renovados</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Versão para tela */}
        <div className="print:hidden">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        `${value} (${chartData.find((d) => d.name === name)?.percentage}%)`,
                        name,
                      ]}
                    />
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Versão para impressão - sem ChartContainer */}
        <div className="print-pie-vencidos flex hidden h-[300px] w-full items-center justify-center print:block">
          <PieChart width={300} height={300}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  className={`pie-sector-${index}`}
                  style={{
                    fill: COLORS[index % COLORS.length],
                    WebkitPrintColorAdjust: "exact",
                    colorAdjust: "exact",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </div>

        {/* Legenda personalizada */}
        <div className="mt-4 flex justify-center gap-6">
          {chartData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full legend-vencidos-${index}`}
                style={{
                  backgroundColor: COLORS[index],
                  WebkitPrintColorAdjust: "exact",
                  colorAdjust: "exact",
                }}
              />
              <span className="text-sm text-gray-600">
                {entry.name}: {entry.value} ({entry.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConveniosVencidosRenovadosChart;

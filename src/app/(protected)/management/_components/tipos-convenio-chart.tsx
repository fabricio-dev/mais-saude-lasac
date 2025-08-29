"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TiposConvenioData {
  empresarial: number;
  individual: number;
}

interface TiposConvenioChartProps {
  data: TiposConvenioData;
  isLoading?: boolean;
}

const chartConfig = {
  empresarial: {
    label: "Empresa",
    color: "#8b5cf6",
  },

  individual: {
    label: "Individual",
    color: "#f97316",
  },
} satisfies ChartConfig;

const TiposConvenioChart = ({
  data,
  isLoading = false,
}: TiposConvenioChartProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading || !isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Convênio Vendidos</CardTitle>
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

  const total = data.empresarial + data.individual;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Convênio Vendidos</CardTitle>
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
      name: "Empresa",
      value: data.empresarial,
      percentage: ((data.empresarial / total) * 100).toFixed(1),
    },
    {
      name: "Individual",
      value: data.individual,
      percentage: ((data.individual / total) * 100).toFixed(1),
    },
  ];

  const COLORS = ["#8b5cf6", "#f97316"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de Convênio Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Versão para tela */}
        <div className="print:hidden">
          <ChartContainer
            config={chartConfig}
            className="h-[250px] w-full sm:h-[300px]"
          >
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-full w-full max-w-[350px] sm:max-w-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
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
              </div>
            </div>
          </ChartContainer>
        </div>

        {/* Versão para impressão - sem ChartContainer */}
        <div className="print-pie-tipos flex hidden h-[300px] w-full items-center justify-center print:block">
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
        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row sm:gap-6">
          {chartData.map((entry, index) => (
            <div
              key={entry.name}
              className="flex items-center justify-center gap-2 sm:justify-start"
            >
              <div
                className={`h-3 w-3 rounded-full legend-tipos-${index} flex-shrink-0`}
                style={{
                  backgroundColor: COLORS[index],
                  WebkitPrintColorAdjust: "exact",
                  colorAdjust: "exact",
                }}
              />
              <span className="text-center text-sm text-gray-600 sm:text-left">
                {entry.name}: {entry.value} ({entry.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TiposConvenioChart;

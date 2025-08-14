"use client";

import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DistribuicaoVendasData {
  renovacao: number;
  novo: number;
}

interface DistribuicaoVendasChartProps {
  data: DistribuicaoVendasData;
  isLoading?: boolean;
}

const DistribuicaoVendasChart = ({
  data,
  isLoading = false,
}: DistribuicaoVendasChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Vendas</CardTitle>
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

  const total = data.renovacao + data.novo;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Vendas</CardTitle>
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
      name: "Renovação",
      value: data.renovacao,
      percentage: ((data.renovacao / total) * 100).toFixed(1),
    },
    {
      name: "Novo",
      value: data.novo,
      percentage: ((data.novo / total) * 100).toFixed(1),
    },
  ];

  const COLORS = ["#3b82f6", "#10b981"];

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      payload: { percentage: string };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background rounded-lg border p-3 shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            {data.value} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Versão para tela */}
        <div className="flex h-[300px] w-full items-center justify-center print:hidden">
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
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </div>

        {/* Versão para impressão - sem ChartContainer */}
        <div className="print-pie-distribuicao hidden h-[300px] w-full items-center justify-center print:flex">
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
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index] }}
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

export default DistribuicaoVendasChart;

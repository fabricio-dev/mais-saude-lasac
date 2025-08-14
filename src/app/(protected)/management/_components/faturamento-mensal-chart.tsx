"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/helpers/currency";

interface FaturamentoMensalData {
  mes: string;
  faturamento: number;
}

interface FaturamentoMensalChartProps {
  data: FaturamentoMensalData[];
  vendedorNome: string;
  isLoading?: boolean;
}

const FaturamentoMensalChart = ({
  data,
  vendedorNome,
  isLoading = false,
}: FaturamentoMensalChartProps) => {
  if (isLoading) {
    return (
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Faturamento Mensal - {vendedorNome}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  // Verificar se há dados válidos
  const hasValidData = data && data.length > 0;
  const totalFaturamento = hasValidData
    ? data.reduce((sum, item) => sum + item.faturamento, 0)
    : 0;

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background rounded-lg border p-3 shadow-md">
          <p className="font-medium">{label}</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#3b82f6]" />
              <span className="text-sm">
                Faturamento: {formatCurrency(payload[0]?.value || 0)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex h-[500px] flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-lg font-semibold">
          Faturamento Mensal - {vendedorNome}
        </CardTitle>
        {hasValidData && (
          <p className="text-muted-foreground text-sm">
            Total: {formatCurrency(totalFaturamento)} | {data.length}{" "}
            {data.length === 1 ? "mês" : "meses"}
          </p>
        )}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 pb-2">
        {hasValidData ? (
          <>
            {/* Versão para tela */}
            <div className="h-full print:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="faturamento"
                    fill="#3b82f6"
                    name="Faturamento"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Versão para impressão */}
            <div className="hidden print:block">
              <BarChart
                width={700}
                height={300}
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 10, fill: "#374151" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#374151" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Bar
                  dataKey="faturamento"
                  fill="#3b82f6"
                  stroke="#3b82f6"
                  name="Faturamento"
                />
              </BarChart>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                Nenhum faturamento encontrado para {vendedorNome} no período
                selecionado
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FaturamentoMensalChart;

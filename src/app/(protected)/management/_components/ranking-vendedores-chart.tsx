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

interface VendedorData {
  nome: string;
  vendas: number;
  faturamento: number;
  meta: number;
  percentualMeta: number;
  totalConvenios: number;
  conveniosEmpresariais: number;
  renovacoes: number;
  novosConvenios: number;
}

interface RankingVendedoresChartProps {
  data: VendedorData[];
  isLoading?: boolean;
}

const chartConfig = {
  faturamento: {
    label: "Faturamento",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

const RankingVendedoresChart = ({
  data,
  isLoading = false,
}: RankingVendedoresChartProps) => {
  // Verificar se há dados válidos
  const hasValidData = data && data.length > 0;

  // Preparar dados para o gráfico (apenas se houver dados válidos)
  const chartData = hasValidData
    ? data.map((item) => ({
        nome: item.nome.split(" ")[0], // Apenas primeiro nome para economizar espaço
        faturamento: item.faturamento,
        vendas: item.vendas,
        percentualMeta: item.percentualMeta || 0,
        fill: "#3b82f6",
      }))
    : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center">
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
          <CardTitle>Ranking de Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center">
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
        <CardTitle>Ranking de Vendedores por Faturamento</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Versão para tela */}
        <div className="print:hidden">
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="nome"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
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
                      const vendas = props?.payload?.vendas || 0;
                      return [
                        <div key="tooltip" className="space-y-1">
                          <div>
                            Faturamento: {formatCurrency(Number(value))}
                          </div>
                          <div>Vendas: {vendas}</div>
                        </div>,
                        "",
                      ];
                    }}
                    labelFormatter={(label) => `Vendedor: ${label}`}
                  />
                }
              />
              <Bar dataKey="faturamento" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        {/* Versão para impressão - com dimensões fixas */}
        <div className="hidden print:block">
          <BarChart
            width={700}
            height={300}
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 10, fill: "#374151" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={{ stroke: "#e5e7eb" }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#374151" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Bar
              dataKey="faturamento"
              radius={[4, 4, 0, 0]}
              fill="#3b82f6"
              stroke="#3b82f6"
            />
          </BarChart>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingVendedoresChart;

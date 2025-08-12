"use client";

import {
  AlertTriangle,
  DollarSign,
  //FileText,
  Plus,
  RefreshCw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyInCents } from "@/helpers/currency";

interface StatsCardsUnidadeProps {
  faturamentoTotal?: number;
  totalPatients: number;
  totalEnterprise: number;
  totalConvenios: number;
  conveniosVencidos: number;
  conveniosRenovados: number;
  novosConvenios: number;
  isLoading?: boolean;
}

const StatsCardsUnidade = ({
  totalPatients,
  totalEnterprise,
  //totalConvenios,
  conveniosVencidos,
  conveniosRenovados,
  novosConvenios,
  isLoading = false,
}: StatsCardsUnidadeProps) => {
  const stats = [
    {
      title: "Faturamento Total",
      value: formatCurrencyInCents(totalPatients, totalEnterprise),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    // {
    //   title: "Total de Convênios",
    //   value: totalConvenios.toString(),
    //   icon: FileText,
    //   color: "text-blue-600",
    //   bgColor: "bg-blue-50",
    //   hidden: true,
    // },
    {
      title: "Convênios Vencidos",
      value: (conveniosVencidos + conveniosRenovados).toString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Convênios Renovados",
      value: conveniosRenovados.toString(),
      icon: RefreshCw,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Novos Convênios",
      value: novosConvenios.toString(),
      icon: Plus,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-24 rounded bg-gray-200"></div>
              </CardTitle>
              <div className="h-4 w-4 rounded bg-gray-200"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCardsUnidade;

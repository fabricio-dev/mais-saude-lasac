import {
  Building2,
  CalendarIcon,
  DollarSignIcon,
  UserIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  totalRevenue: string | null;
  totalPatients: number;
  totalSellers: number;
  gestorClinic: string | null;
}

const StatsCards = ({
  totalRevenue,
  totalPatients,
  totalSellers,
  gestorClinic,
}: StatsCardsProps) => {
  const stats = [
    {
      title: "Unidade",
      value: gestorClinic || "N/A",
      icon: Building2,
    },
    {
      title: "Faturamento",
      value: totalRevenue || "R$ 0,00",
      icon: DollarSignIcon,
    },
    {
      title: "Convênios",
      value: totalPatients.toString(),
      icon: CalendarIcon,
    },
    {
      title: "Vendedores",
      value: totalSellers.toString(),
      icon: UserIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="gap-4">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <Icon className="h-4 w-4 text-red-800" />
              </div>
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold sm:text-2xl">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;

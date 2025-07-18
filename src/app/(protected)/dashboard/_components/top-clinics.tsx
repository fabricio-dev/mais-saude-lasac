import { Hospital } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TopClinicsProps {
  topClinics: {
    clinic: string;
    patients: number;
  }[];
}

export default function TopClinics({ topClinics }: TopClinicsProps) {
  const maxAppointments = Math.max(...topClinics.map((i) => i.patients));
  return (
    <Card className="mx-auto w-full">
      <CardContent>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hospital className="text-gray-500" />
            <CardTitle className="text-base">Unidades</CardTitle>
          </div>
        </div>

        {/* units List */}
        <div className="space-y-6">
          {topClinics.map((clinic) => {
            // Porcentagem de ocupação da especialidade baseando-se no maior número de agendamentos
            const progressValue = (clinic.patients / maxAppointments) * 100;

            return (
              <div key={clinic.clinic} className="flex items-center gap-2">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-lg font-medium text-gray-500">
                      {clinic.clinic
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex w-full flex-col justify-center">
                  <div className="flex w-full justify-between">
                    <h3 className="text-sm">{clinic.clinic}</h3>
                    <div className="text-right">
                      <span className="text-muted-foreground text-sm font-medium">
                        {clinic.patients} Convenios
                      </span>
                    </div>
                  </div>
                  <Progress value={progressValue} className="w-full" />
                  <div className="flex w-full justify-between">
                    <span className="text-muted-foreground text-sm font-medium">
                      {progressValue}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

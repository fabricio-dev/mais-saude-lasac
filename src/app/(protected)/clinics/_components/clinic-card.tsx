"use client";

import dayjs from "dayjs";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { clinicsTable } from "@/db/schema";

import UpsertClinicForm from "./upsert-clinic-form";

interface ClinicCardProps {
  clinic: typeof clinicsTable.$inferSelect;
}

const ClinicCard = ({ clinic }: ClinicCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatDate = (date: Date) => {
    return dayjs(date).format("DD/MM/YYYY");
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-amber-950">{clinic.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm text-gray-600">
          <p>
            <strong>Criada em:</strong> {formatDate(clinic.createdAt)}
          </p>
          {clinic.updatedAt && clinic.updatedAt !== clinic.createdAt && (
            <p>
              <strong>Atualizada em:</strong> {formatDate(clinic.updatedAt)}
            </p>
          )}
        </div>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIsDialogOpen(true)}
          >
            Editar clínica
          </Button>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <UpsertClinicForm
          clinic={clinic}
          onSuccess={() => setIsDialogOpen(false)}
        />
      </Dialog>
    </Card>
  );
};

export default ClinicCard;

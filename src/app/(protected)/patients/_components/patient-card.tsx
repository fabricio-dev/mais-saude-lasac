"use client";

import dayjs from "dayjs";
import { CheckCircle } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { activatePatient } from "@/actions/activate-patient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { patientsTable } from "@/db/schema";

import PrintCardComponent from "../../_components/print-card-component";
import UpsertPatientForm from "./upsert-patient-form";

interface PatientCardProps {
  patient: typeof patientsTable.$inferSelect & {
    seller?: { name: string } | null;
  };
}

const PatientCard = ({ patient }: PatientCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const activatePatientAction = useAction(activatePatient, {
    onSuccess: () => {
      toast.success("Paciente ativado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao ativar paciente");
    },
  });

  const handleActivatePatient = () => {
    activatePatientAction.execute({ patientId: patient.id });
  };

  const isPatientExpired = () => {
    if (!patient.expirationDate) return false;
    return new Date(patient.expirationDate) <= new Date();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <Card
      className={`transition-shadow hover:shadow-md ${isPatientExpired() ? "border-red-200 bg-red-50" : ""}`}
    >
      <CardHeader className="pb-3">
        <CardTitle
          className={`text-lg ${isPatientExpired() ? "text-red-800" : "text-amber-950"}`}
        >
          {patient.name}
        </CardTitle>
        <div className="flex gap-2">
          <Badge
            variant={
              patient.cardType === "enterprise" ? "default" : "secondary"
            }
          >
            {patient.cardType === "enterprise" ? "EMPRESA" : "INDIVIDUAL"}
          </Badge>
          <Badge variant="outline">{patient.numberCards} cartões</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm text-gray-600">
          <p>
            <strong>CPF:</strong>{" "}
            {patient.cpfNumber ? formatCpf(patient.cpfNumber) : ""}
          </p>
          <p>
            <strong>Telefone:</strong> {formatPhone(patient.phoneNumber)}
          </p>
          <p>
            <strong>Data Nasc:</strong>{" "}
            {patient.birthDate ? formatDate(new Date(patient.birthDate)) : ""}
          </p>

          {patient.seller && (
            <p>
              <strong>Vendedor:</strong> {patient.seller.name}
            </p>
          )}

          {patient.expirationDate && (
            <p
              className={`font-medium ${isPatientExpired() ? "text-red-600" : "text-gray-600"}`}
            >
              <strong>{isPatientExpired() ? "Venceu em:" : "Vence em:"}</strong>{" "}
              {formatDate(new Date(patient.expirationDate))}
            </p>
          )}
        </div>
        <div className="text-xs text-gray-500">
          <p>
            {patient.address}, {patient.city} - {patient.state}
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          {isPatientExpired() && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-green-300"
                  disabled={activatePatientAction.status === "executing"}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  {activatePatientAction.status === "executing"
                    ? "Ativando..."
                    : "Ativar"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ativar Paciente</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja ativar este paciente? Esta ação irá
                    renovar a data de expiração por mais um ano e não pode ser
                    desfeita.
                    <br />
                    <br />
                    <strong>Paciente:</strong> {patient.name}
                    <br />
                    <strong>Nova data de expiração:</strong>{" "}
                    {dayjs().add(1, "year").format("DD/MM/YYYY")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleActivatePatient}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Confirmar Ativação
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setIsDialogOpen(true)}
          >
            Ver detalhes
          </Button>
          <PrintCardComponent
            patient={patient}
            variant="outline"
            size="icon"
            className="px-3"
          />
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <UpsertPatientForm
          isOpen={isDialogOpen}
          patient={patient}
          onSuccess={() => setIsDialogOpen(false)}
        />
      </Dialog>
    </Card>
  );
};

export default PatientCard;

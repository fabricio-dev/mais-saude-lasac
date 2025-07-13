"use client";

import dayjs from "dayjs";
import { CheckCircle, PrinterIcon } from "lucide-react";
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

  const formatRg = (rg: string) => {
    return rg.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dados do Paciente - ${patient.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              margin-bottom: 30px;
              padding-bottom: 20px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section h3 {
              background-color: #f5f5f5;
              padding: 10px;
              margin: 0 0 15px 0;
              border-left: 4px solid #333;
            }
            .data-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .label {
              font-weight: bold;
              min-width: 150px;
            }
            .value {
              flex: 1;
              text-align: right;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              background-color: #e9ecef;
              border-radius: 4px;
              font-size: 12px;
              margin-right: 5px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DADOS DO PACIENTE</h1>
            <h2>${patient.name}</h2>
            <div>
              <span class="badge">${patient.cardType === "enterprise" ? "EMPRESA" : "INDIVIDUAL"}</span>
              <span class="badge">${patient.numberCards} cartões</span>
            </div>
          </div>

          <div class="section">
            <h3>Informações Pessoais</h3>
            <div class="data-row">
              <span class="label">Nome Completo:</span>
              <span class="value">${patient.name}</span>
            </div>
            <div class="data-row">
              <span class="label">CPF:</span>
              <span class="value">${formatCpf(patient.cpfNumber)}</span>
            </div>
            <div class="data-row">
              <span class="label">RG:</span>
              <span class="value">${formatRg(patient.rgNumber)}</span>
            </div>
            <div class="data-row">
              <span class="label">Data de Nascimento:</span>
              <span class="value">${formatDate(new Date(patient.birthDate))}</span>
            </div>
            <div class="data-row">
              <span class="label">Telefone:</span>
              <span class="value">${formatPhone(patient.phoneNumber)}</span>
            </div>
          </div>

          <div class="section">
            <h3>Endereço</h3>
            <div class="data-row">
              <span class="label">Endereço:</span>
              <span class="value">${patient.address}, ${patient.homeNumber}</span>
            </div>
            <div class="data-row">
              <span class="label">Cidade:</span>
              <span class="value">${patient.city}</span>
            </div>
            <div class="data-row">
              <span class="label">Estado:</span>
              <span class="value">${patient.state}</span>
            </div>
          </div>

          <div class="section">
            <h3>Informações do Contrato</h3>
            <div class="data-row">
              <span class="label">Tipo de Cartão:</span>
              <span class="value">${patient.cardType === "enterprise" ? "EMPRESA" : "INDIVIDUAL"}</span>
            </div>
            <div class="data-row">
              <span class="label">Número de Cartões:</span>
              <span class="value">${patient.numberCards}</span>
            </div>
           
            ${
              patient.seller
                ? `
            <div class="data-row">
              <span class="label">Vendedor Responsável:</span>
              <span class="value">${patient.seller.name}</span>
            </div>
            `
                : ""
            }
            ${
              patient.expirationDate
                ? `
            <div class="data-row">
              <span class="label">Data de Expiração:</span>
              <span class="value">${formatDate(new Date(patient.expirationDate))}</span>
            </div>
            `
                : ""
            }
          </div>

          ${
            patient.dependents1 ||
            patient.dependents2 ||
            patient.dependents3 ||
            patient.dependents4 ||
            patient.dependents5
              ? `
          <div class="section">
            <h3>Dependentes</h3>
            ${patient.dependents1 ? `<div class="data-row"><span class="label">Dependente 1:</span><span class="value">${patient.dependents1}</span></div>` : ""}
            ${patient.dependents2 ? `<div class="data-row"><span class="label">Dependente 2:</span><span class="value">${patient.dependents2}</span></div>` : ""}
            ${patient.dependents3 ? `<div class="data-row"><span class="label">Dependente 3:</span><span class="value">${patient.dependents3}</span></div>` : ""}
            ${patient.dependents4 ? `<div class="data-row"><span class="label">Dependente 4:</span><span class="value">${patient.dependents4}</span></div>` : ""}
            ${patient.dependents5 ? `<div class="data-row"><span class="label">Dependente 5:</span><span class="value">${patient.dependents5}</span></div>` : ""}
          </div>
          `
              : ""
          }

          <div class="section">
            <h3>Informações do Sistema</h3>
            <div class="data-row">
              <span class="label">Data de Cadastro:</span>
              <span class="value">${formatDate(new Date(patient.createdAt))}</span>
            </div>
            <div class="data-row">
              <span class="label">Última Atualização:</span>
              <span class="value">${formatDate(new Date(patient.updatedAt ?? ""))}</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
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
            <strong>CPF:</strong> {formatCpf(patient.cpfNumber)}
          </p>
          <p>
            <strong>Telefone:</strong> {formatPhone(patient.phoneNumber)}
          </p>
          <p>
            <strong>Data Nasc:</strong>{" "}
            {formatDate(new Date(patient.birthDate))}
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
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="px-3"
          >
            <PrinterIcon className="h-4 w-4" />
          </Button>
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

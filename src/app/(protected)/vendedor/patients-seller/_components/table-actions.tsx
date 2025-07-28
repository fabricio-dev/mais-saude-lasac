"use client";

import {
  CheckCircle,
  Edit2,
  MoreHorizontal,
  PrinterIcon,
  Trash2,
} from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import UpsertPatientForm from "./upsert-patient-form";

interface Patient {
  id: string;
  name: string;
  cpfNumber: string;
  phoneNumber: string;
  city: string;
  cardType: "enterprise" | "personal";
  numberCards: number;
  expirationDate: Date | null;
  birthDate: Date;
  rgNumber: string;
  address: string;
  homeNumber: string;
  state: string;
  Enterprise: string | null;
  dependents1: string | null;
  dependents2: string | null;
  dependents3: string | null;
  dependents4: string | null;
  dependents5: string | null;
  observation: string | null;
  statusAgreement: "expired" | "active" | "pending" | null;
  createdAt: Date;
  updatedAt: Date | null;
  sellerId: string | null;
  clinicId: string | null;
  seller?: { name: string } | null;
  isActive: boolean;
  reactivatedAt: Date | null;
  activeAt: Date | null;
}

interface TableActionsProps {
  patient: Patient;
  isExpired: boolean;
  onActivate: (patientId: string) => void;
  onDelete: (patientId: string) => void;
  onPrintCard: (patient: Patient) => void;
  onPrintContract: (patient: Patient) => void;
  sellerId: string;
  clinicId: string;
}

export default function TableActions({
  patient,
  isExpired,
  onActivate,
  onDelete,
  onPrintCard,
  onPrintContract,
  sellerId,
  clinicId,
}: TableActionsProps) {
  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Dialog>
            <DialogTitle hidden>Editar Paciente</DialogTitle>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <UpsertPatientForm
                patient={{
                  ...patient,
                  birthDate: patient.birthDate.toISOString().split("T")[0],
                  clinicId: patient.clinicId,
                  isActive: patient.isActive,
                  reactivatedAt: patient.reactivatedAt,
                  activeAt: patient.activeAt,
                }}
                isOpen={true}
                sellerId={sellerId}
                clinicId={clinicId}
              />
            </DialogContent>
          </Dialog>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <PrinterIcon className="mr-2 h-4 w-4" />
              Imprimir
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => onPrintCard(patient)}
                className="cursor-pointer"
              >
                <PrinterIcon className="mr-2 h-4 w-4" />
                Imprimir Cartão
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onPrintContract(patient)}
                className="cursor-pointer"
              >
                <PrinterIcon className="mr-2 h-4 w-4" />
                Imprimir Contrato
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {isExpired && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Ativar
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ativar Paciente</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja ativar este paciente? Isso irá
                    renovar a data de expiração por mais 1 ano.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onActivate(patient.id)}>
                    Ativar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Paciente</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este paciente? Esta ação não
                  pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(patient.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

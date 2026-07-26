"use client";

import {
  CheckCircle,
  Edit2,
  MoreHorizontal,
  PrinterIcon,
  Trash2,
} from "lucide-react";
import { useState } from "react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentType = "pix" | "dinheiro" | "cartao_credito" | "cartao_debito";

import PrintCardComponent from "../../_components/print-card-component";
import UpsertPatientForm from "./upsert-patient-form";

interface Patient {
  id: string;
  name: string;
  cpfNumber: string | null;
  phoneNumber: string;
  city: string | null;
  cardType: "enterprise" | "personal";
  numberCards: number | null;
  expirationDate: Date | null;
  birthDate: Date | null;
  rgNumber: string | null;
  address: string | null;
  homeNumber: string | null;
  state: string | null;
  Enterprise: string | null;
  dependents1: string | null;
  dependents2: string | null;
  dependents3: string | null;
  dependents4: string | null;
  dependents5: string | null;
  dependents6: string | null;
  observation: string | null;
  statusAgreement: "expired" | "pending" | null;
  createdAt: Date;
  updatedAt: Date | null;
  sellerId: string | null;
  clinicId: string | null;
  seller?: { name: string } | null;
  isActive: boolean;
  reactivatedAt: Date | null;
  activeAt: Date | null; // mudie aqui para o campo de ativação
  whatsappConsent: boolean;
  paymentType: "pix" | "dinheiro" | "cartao_credito" | "cartao_debito" | null;
}

interface TableActionsProps {
  patient: Patient;
  isExpired: boolean;
  isPending: boolean;
  onActivate: (patientId: string, paymentType: PaymentType) => void;
  onDelete: (patientId: string) => void;
  onPrintCard: (patient: Patient) => void;
  onPrintContract: (patient: Patient) => void;
}

export default function TableActions({
  patient,
  isExpired,
  isPending,
  onActivate,
  onDelete,
  //onPrintCard,
  onPrintContract,
}: TableActionsProps) {
  const [paymentType, setPaymentType] = useState<PaymentType | undefined>(
    undefined,
  );

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
                  birthDate: patient.birthDate
                    ? patient.birthDate.toISOString().split("T")[0]
                    : "",
                  clinicId: patient.clinicId,
                  isActive: patient.isActive,
                  reactivatedAt: patient.reactivatedAt,
                  activeAt: patient.activeAt, // mudie aqui para o campo de ativação
                }}
                isOpen={true}
              />
            </DialogContent>
          </Dialog>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <PrinterIcon className="mr-2 h-4 w-4" />
              Imprimir
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem asChild>
                <div className="cursor-pointer">
                  <PrintCardComponent
                    patient={{
                      ...patient,
                      birthDate: patient.birthDate
                        ? patient.birthDate.toISOString().split("T")[0]
                        : "",
                      seller: patient.seller || null,
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-auto w-full justify-start p-0 font-normal"
                  />
                </div>
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

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className={`cursor-pointer ${isExpired ? "text-green-600" : "text-muted-foreground"}`}
              >
                <CheckCircle
                  className={`mr-2 h-4 w-4 ${isExpired ? "text-green-600" : "text-muted-foreground"}`}
                />
                {isPending ? "Ativar" : "Renovar"}
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isPending ? "Ativar convenio" : "Renovar convenio"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isPending
                    ? "Atenção! Este convenio está aguardando a aprovação. Ao ativar você estará garantindo que o cliente ja fez o pagamento. Isso ira garantir que ele tenha acesso aos beneficios do convenio."
                    : isExpired
                      ? "Tem certeza que deseja renovar este convenio? Isso irá renovar a data de vencimento por mais 1 ano."
                      : "Tem certeza que deseja Fazer a Renovação antecipada deste convenio?  Isso irá somar 1 ano a data de vencimento atual."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label>Tipo de Pagamento</Label>
                <Select
                  value={paymentType}
                  onValueChange={(value) =>
                    setPaymentType(value as PaymentType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="dinheiro">DINHEIRO</SelectItem>
                    <SelectItem value="cartao_credito">
                      CARTÃO DE CRÉDITO
                    </SelectItem>
                    <SelectItem value="cartao_debito">
                      CARTÃO DE DÉBITO
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={!paymentType}
                  onClick={() => {
                    if (paymentType) {
                      onActivate(patient.id, paymentType);
                    }
                  }}
                >
                  {isPending ? "Ativar" : "Renovar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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

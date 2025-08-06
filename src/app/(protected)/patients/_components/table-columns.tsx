"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";

import TableActions from "./table-actions";

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
  activeAt: Date | null;
}

interface TableColumnsProps {
  onActivate: (patientId: string) => void;
  onDelete: (patientId: string) => void;
  onPrintCard: (patient: Patient) => void;
  onPrintContract: (patient: Patient) => void;
}

// Funções de formatação
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("pt-BR");
};

const formatPhone = (phone: string) => {
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const isPatientExpired = (expirationDate: Date | null) => {
  if (!expirationDate) return false;
  return new Date(expirationDate) <= new Date();
};
const isPatientPending = (activeAt: Date | null) => {
  if (!activeAt) return true;
  return false;
};

export const patientsTableColumns = ({
  onActivate,
  onDelete,
  onPrintCard,
  onPrintContract,
}: TableColumnsProps): ColumnDef<Patient>[] => [
  {
    id: "spacer",
    header: "",
    cell: () => <div className="w-0" />,
    size: 0,
  },
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Telefone",
    cell: ({ row }) => {
      const phone = row.getValue("phoneNumber") as string;
      return <div className="text-sm">{formatPhone(phone)}</div>;
    },
  },
  {
    accessorKey: "seller",
    header: "Vendedor",
    cell: ({ row }) => {
      const seller = row.original.seller;
      return <div className="text-sm">{seller?.name || "Não atribuído"}</div>;
    },
  },
  {
    accessorKey: "cardType",
    header: "Tipo de Cartão",
    cell: ({ row }) => {
      const cardType = row.getValue("cardType") as string;
      return (
        <Badge variant="secondary">
          {cardType === "enterprise" ? "EMPRESA" : "INDIVIDUAL"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "expirationDate",
    header: "Data de Expiração",
    cell: ({ row }) => {
      const expirationDate = row.getValue("expirationDate") as Date | null;
      if (!expirationDate)
        return <div className="text-muted-foreground">-</div>;

      const isExpired = isPatientExpired(expirationDate);
      return (
        <div
          className={`text-sm ${isExpired ? "font-medium text-red-600" : "text-muted-foreground"}`}
        >
          {formatDate(expirationDate)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const expirationDate = row.getValue("expirationDate") as Date | null;
      const isExpired = isPatientExpired(expirationDate);
      const isPending = isPatientPending(row.original.activeAt);
      return (
        <Badge
          variant={isExpired ? "destructive" : "default"}
          className={
            isExpired
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }
        >
          {isExpired && isPending
            ? "Pendente"
            : isExpired
              ? "Vencido"
              : "Ativo"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const patient = row.original;
      const isExpired = isPatientExpired(patient.expirationDate);
      const isPending = isPatientPending(patient.activeAt);
      return (
        <TableActions
          patient={patient}
          isExpired={isExpired}
          isPending={isPending}
          onActivate={onActivate}
          onDelete={onDelete}
          onPrintCard={onPrintCard}
          onPrintContract={onPrintContract}
        />
      );
    },
  },
];

// Versão simplificada sem ações para o dashboard
export const patientsTableColumnsSimple: ColumnDef<Patient>[] = [
  {
    id: "spacer",
    header: "",
    cell: () => <div className="w-0" />,
    size: 0,
  },
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Telefone",
    cell: ({ row }) => {
      const phoneNumber = row.original.phoneNumber;
      return <div className="text-sm">{formatPhone(phoneNumber)}</div>;
    },
  },
  {
    accessorKey: "seller",
    header: "Vendedor",
    cell: ({ row }) => {
      const seller = row.original.seller;
      return <div className="text-sm">{seller?.name || "Não atribuído"}</div>;
    },
  },

  {
    accessorKey: "expirationDate",
    header: "Data de Expiração",
    cell: ({ row }) => {
      const expirationDate = row.getValue("expirationDate") as Date | null;
      if (!expirationDate)
        return <div className="text-muted-foreground">-</div>;

      const isExpired = isPatientExpired(expirationDate);
      return (
        <div
          className={`text-sm ${isExpired ? "font-medium text-red-600" : "text-muted-foreground"}`}
        >
          {formatDate(expirationDate)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const expirationDate = row.getValue("expirationDate") as Date | null;
      const isExpired = isPatientExpired(expirationDate);
      const isPending = isPatientPending(row.original.activeAt);

      return (
        <Badge
          variant={isExpired ? "destructive" : "default"}
          className={
            isExpired
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }
        >
          {isExpired && isPending
            ? "Pendente"
            : isExpired
              ? "Vencido"
              : "Ativo"}
        </Badge>
      );
    },
  },
];

"use client";

import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";

import { Badge } from "@/components/ui/badge";

import TableActions from "./table-actions";

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
  clinic?: { name: string } | null;
  isActive: boolean;
  reactivatedAt: Date | null;
  activeAt: Date | null;
}

interface TableColumnsProps {
  onActivate: (patientId: string) => void;
  onDelete: (patientId: string) => void;
  onPrintContract: (patient: Patient) => void;
  sellerId: string;
  clinicId: string;
}

// Funções de formatação
const formatDate = (date: Date) => {
  return dayjs(date).format("DD/MM/YYYY");
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
  onPrintContract,
  sellerId,
  clinicId,
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
    accessorKey: "city",
    header: "Cidade",
    cell: ({ row }) => {
      return <div className="text-sm">{row.getValue("city")}</div>;
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
    accessorKey: "seller",
    header: "Vendedor",
    cell: ({ row }) => {
      const seller = row.original.seller;
      return (
        <div className="text-sm">
          {seller?.name || <span className="text-muted-foreground">-</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "clinic",
    header: "Unidade",
    cell: ({ row }) => {
      const clinic = row.original.clinic;
      return (
        <div className="text-sm">
          {clinic?.name || <span className="text-muted-foreground">-</span>}
        </div>
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
      const isUndefined = expirationDate === null;

      if (isUndefined) {
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Indefinido
          </Badge>
        );
      }

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
          onPrintContract={onPrintContract}
          sellerId={sellerId}
          clinicId={clinicId}
        />
      );
    },
  },
];

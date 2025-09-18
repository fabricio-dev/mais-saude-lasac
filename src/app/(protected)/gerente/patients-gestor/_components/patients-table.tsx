"use client";

import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import { activatePatient } from "@/actions/activate-patient";
import { deletePatient } from "@/actions/delete-patient";
import { PrintableContrato } from "@/app/(protected)/_components/contrato-component";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { patientsTableColumns } from "./table-columns";

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

interface PatientsTableProps {
  patients: Patient[];
  gestorClinicId: string;
}

const PatientsTable = ({ patients, gestorClinicId }: PatientsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const activatePatientAction = useAction(activatePatient, {
    onSuccess: () => {
      toast.success("Paciente ativado ou renovado com sucesso!");
    },
    onError: () => {
      toast.error(
        "Erro ao ativar ou renovar paciente, verifique se o convenio pertence a sua unidade e tente novamente",
      );
    },
  });

  const deletePatientAction = useAction(deletePatient, {
    onSuccess: () => {
      toast.success("Paciente excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao excluir paciente");
    },
  });

  const handleActivate = (patientId: string) => {
    activatePatientAction.execute({ patientId });
  };

  const handleDelete = (patientId: string) => {
    deletePatientAction.execute({ id: patientId });
  };

  // const formatPhone = (phone: string) => {
  //   return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  // };

  // const formatCpf = (cpf: string) => {
  //   return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  // };

  // const formatRg = (rg: string) => {
  //   return rg.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4");
  // };

  const [patientToPrint, setPatientToPrint] = useState<
    (Patient & { clinic?: { name: string } }) | null
  >(null);

  const handlePrintContract = async (patient: Patient) => {
    try {
      // Buscar informações da clínica se o patient tiver clinicId
      const patientWithClinic = { ...patient } as Patient & {
        clinic?: { name: string };
      };
      if (patient.clinicId) {
        try {
          const response = await fetch(`/api/clinics/${patient.clinicId}`);
          if (response.ok) {
            const clinic = await response.json();
            patientWithClinic.clinic = { name: clinic.name };
          }
        } catch (error) {
          console.error("Erro ao buscar clínica:", error);
        }
      }

      setPatientToPrint(patientWithClinic);
    } catch (error) {
      console.error("Erro ao renderizar contrato:", error);
      // Fallback: abrir em nova aba se houver erro
      alert("Erro ao gerar contrato. Tente novamente.");
    }
  };

  const columns = patientsTableColumns({
    onActivate: handleActivate,
    onDelete: handleDelete,
    onPrintContract: handlePrintContract,
    sellerId: "", // Não é necessário para o gestor
    clinicId: gestorClinicId,
  });

  const table = useReactTable({
    data: patients,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 12,
      },
    },
  });

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Nenhum paciente encontrado
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Não há pacientes cadastrados na sua unidade ou não há pacientes que
          correspondam à sua busca.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          Mostrando {table.getRowModel().rows.length} de {patients.length}{" "}
          pacientes
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* Componente para impressão de contrato */}
      {patientToPrint && (
        <PrintableContrato
          patient={patientToPrint}
          numeroContrato={patientToPrint.id.slice(-6)}
          onPrintComplete={() => setPatientToPrint(null)}
        />
      )}
    </div>
  );
};

export default PatientsTable;

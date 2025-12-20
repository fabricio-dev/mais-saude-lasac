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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PrintableContrato } from "../../_components/contrato-component";
import { patientsTableColumns } from "./table-columns";

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
  activeAt: Date | null;
  whatsappConsent: boolean;
}

interface PatientsTableProps {
  patients: Patient[];
}

export default function PatientsTable({ patients }: PatientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const activatePatientAction = useAction(activatePatient, {
    onSuccess: () => {
      toast.success("Paciente ativado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao ativar paciente");
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

  const handleActivatePatient = (patientId: string) => {
    activatePatientAction.execute({ patientId });
  };

  const handleDeletePatient = (patientId: string) => {
    deletePatientAction.execute({ id: patientId });
  };

  // Funções de formatação (apenas para impressão)
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
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
      console.error("Erro ao preparar contrato:", error);
    }
  };

  const handlePrintCard = (patient: Patient) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Coletar todos os dependentes não vazios
    const dependents = [
      patient.dependents1,
      patient.dependents2,
      patient.dependents3,
      patient.dependents4,
      patient.dependents5,
      patient.dependents6,
    ].filter(Boolean);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartão do Paciente - ${patient.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .card {
              width: 85.60mm;
              height: 53.98mm;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 8px;
              color: white;
              box-shadow: 0 8px 16px rgba(0,0,0,0.3);
              position: relative;
              overflow: hidden;
            }
            .card::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 100%;
              height: 100%;
              background: rgba(255,255,255,0.1);
              border-radius: 50%;
              transform: rotate(45deg);
            }
            .card-header {
              text-align: center;
              margin-bottom: 6px;
              position: relative;
              z-index: 1;
            }
            .card-title {
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 2px;
            }
            .card-subtitle {
              font-size: 8px;
              opacity: 0.9;
            }
            .card-content {
              position: relative;
              z-index: 1;
            }
            .patient-name {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .patient-info {
              font-size: 8px;
              margin-bottom: 3px;
              opacity: 0.95;
            }
            .cpf {
              font-size: 9px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .dependents {
              font-size: 7px;
              margin-bottom: 4px;
            }
            .dependents-title {
              font-weight: bold;
              margin-bottom: 2px;
            }
            .dependent-item {
              margin-bottom: 1px;
              opacity: 0.9;
            }
            .expiration {
              font-size: 8px;
              text-align: right;
              margin-top: 4px;
              font-weight: bold;
            }
            .card-footer {
              position: absolute;
              bottom: 8px;
              right: 8px;
              font-size: 6px;
              opacity: 0.7;
            }
            @media print {
              body {
                background-color: white;
                margin: 0;
                padding: 0;
              }
              .card {
                box-shadow: none;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="card-header">
              <div class="card-title">MAIS SAÚDE</div>
              <div class="card-subtitle">Cartão de Saúde</div>
            </div>
            <div class="card-content">
              <div class="patient-name">${patient.name}</div>
            
              
              ${
                dependents.length > 0
                  ? `
                <div class="dependents">
                  <div class="dependents-title">DEPENDENTES:</div>
                  ${dependents.map((dep) => `<div class="dependent-item">• ${dep}</div>`).join("")}
                </div>
              `
                  : ""
              }
              
              ${
                patient.expirationDate
                  ? `
                <div class="expiration">
                  VÁLIDO ATÉ: ${formatDate(new Date(patient.expirationDate))}
                </div>
              `
                  : ""
              }
            </div>
            <div class="card-footer">
              ${patient.cardType === "enterprise" ? "EMPRESA" : "INDIVIDUAL"}
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

  const columns = patientsTableColumns({
    onActivate: handleActivatePatient,
    onDelete: handleDeletePatient,
    onPrintCard: handlePrintCard,
    onPrintContract: handlePrintContract,
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
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 12,
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md">
        <Table>
          <TableHeader className="rounded-md bg-blue-50/70">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
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
}

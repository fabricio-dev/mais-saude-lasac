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

interface Seller {
  id: string;
  name: string;
  email: string;
}

interface PatientsTableProps {
  patients: Patient[];
  gestorClinicId: string;
  sellers: Seller[];
}

const PatientsTable = ({
  patients,
  gestorClinicId,
  sellers,
}: PatientsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

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

  const handleActivate = (patientId: string) => {
    activatePatientAction.execute({ patientId });
  };

  const handleDelete = (patientId: string) => {
    deletePatientAction.execute({ id: patientId });
  };

  // Funções de formatação (apenas para impressão)
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
              <div class="cpf">CPF: ${formatCpf(patient.cpfNumber)}</div>
              
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

  const handlePrintContract = (patient: Patient) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contrato do Paciente - ${patient.name}</title>
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
            <h1>CONTRATO DO PACIENTE</h1>
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
            patient.dependents5 ||
            patient.dependents6
              ? `
          <div class="section">
            <h3>Dependentes</h3>
            ${patient.dependents1 ? `<div class="data-row"><span class="label">Dependente 1:</span><span class="value">${patient.dependents1}</span></div>` : ""}
            ${patient.dependents2 ? `<div class="data-row"><span class="label">Dependente 2:</span><span class="value">${patient.dependents2}</span></div>` : ""}
            ${patient.dependents3 ? `<div class="data-row"><span class="label">Dependente 3:</span><span class="value">${patient.dependents3}</span></div>` : ""}
            ${patient.dependents4 ? `<div class="data-row"><span class="label">Dependente 4:</span><span class="value">${patient.dependents4}</span></div>` : ""}
            ${patient.dependents5 ? `<div class="data-row"><span class="label">Dependente 5:</span><span class="value">${patient.dependents5}</span></div>` : ""}
            ${patient.dependents6 ? `<div class="data-row"><span class="label">Dependente 6:</span><span class="value">${patient.dependents6}</span></div>` : ""}
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

  const columns = patientsTableColumns({
    onActivate: handleActivate,
    onDelete: handleDelete,
    onPrintCard: handlePrintCard,
    onPrintContract: handlePrintContract,
    sellerId: "", // Não é necessário para o gestor
    clinicId: gestorClinicId,
    sellers: sellers,
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
    </div>
  );
};

export default PatientsTable;

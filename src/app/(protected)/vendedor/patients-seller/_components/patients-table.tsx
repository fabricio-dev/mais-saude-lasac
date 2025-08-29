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
import { renderToStaticMarkup } from "react-dom/server";
import { toast } from "sonner";

import { activatePatient } from "@/actions/activate-patient";
import { deletePatient } from "@/actions/delete-patient";
import ContratoComponent from "@/app/(protected)/_components/contrato-component";
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
  sellerId: string;
  clinicId: string;
}

const PatientsTable = ({
  patients,
  sellerId,
  clinicId,
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

  // const formatPhone = (phone: string) => {
  //   return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  // };

  // const formatCpf = (cpf: string) => {
  //   return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  // };

  // const formatRg = (rg: string) => {
  //   return rg.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4");
  // };

  const handlePrintCard = (patient: Patient) => {
    // Usar a estrutura do componente PrintCardComponent
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

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
               font-family: 'Arial', 'Helvetica', sans-serif;
               background-color: #f0f0f0;
               display: flex;
               justify-content: center;
               align-items: center;
               min-height: 100vh;
               padding: 20px;
               -webkit-font-smoothing: antialiased;
               -moz-osx-font-smoothing: grayscale;
               text-rendering: optimizeLegibility;
             }
                         .card {
               width: 85.60mm;
               height: 53.98mm;
               background: white;
               border-radius: 10px;
               padding: 15px;
               color: black;
               box-shadow: 0 8px 16px rgba(0,0,0,0.3);
               position: relative;
               overflow: hidden;
               -webkit-print-color-adjust: exact;
               color-adjust: exact;
               font-weight: 500;
             }

            .card-header {
              text-align: center;
              margin-bottom: 8px;
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
              font-size: 12px;
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
               bottom: 0;
               left: 0;
               right: 0;
               height: 20px;
               font-size: 6px;
               opacity: 0.7;
             }
             img {
               image-rendering: -webkit-optimize-contrast;
               image-rendering: -moz-crisp-edges;
               image-rendering: crisp-edges;
               image-rendering: pixelated;
               -webkit-print-color-adjust: exact;
               color-adjust: exact;
               filter: contrast(1.1) brightness(1.1);
             }
                         @media print {
               body {
                 background-color: white;
                 margin: 0;
                 padding: 0;
                 -webkit-print-color-adjust: exact;
                 color-adjust: exact;
               }
               .card {
                 box-shadow: none;
                 margin: 0;
                 page-break-inside: avoid;
                 -webkit-print-color-adjust: exact;
                 color-adjust: exact;
               }
               img {
                 -webkit-print-color-adjust: exact;
                 color-adjust: exact;
                 image-rendering: -webkit-optimize-contrast;
                 image-rendering: crisp-edges;
               }
               @page {
                 margin: 0.5cm;
                 size: A4;
               }
             }
          </style>
        </head>
                 <body>
           <div class="card p-10">
             <div class="card-header">
              
             </div>
             <div class="card-content">
               <div class="patient-name"> TITULAR: ${patient.name}</div>
             
              
              
              ${
                dependents.length > 0
                  ? `
                <div class="dependents">
                  <div class="dependents-title">DEPENDENTES:</div>
                  ${dependents.map((dep) => `<div class="dependent-item"> ${dep}</div>`).join("")}
                </div>
              `
                  : ""
              }
              
                                            <img src="/logo.svg" alt="Mais Saúde" style="width: 40px; height: 40px; position: absolute; top: 15px; right: 15px; image-rendering: auto; image-rendering: -webkit-optimize-contrast; image-rendering: pixelated; -webkit-print-color-adjust: exact; color-adjust: exact; filter: contrast(1.2); max-width: none; max-height: none;">
               

            </div>
            <div class="card-footer">
              <div style="position: absolute; bottom: 15px; left: 15px; font-size: 8px; font-weight: bold;">
                ${patient.expirationDate ? `VÁLIDO ATÉ: ${formatDate(new Date(patient.expirationDate))}` : ""}
              </div>
              <div style="position: absolute; bottom: 15px; right: 15px;">
                ${patient.cardType === "enterprise" ? "EMPRESA" : "INDIVIDUAL"}
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
              
              // Fechar janela se o usuário cancelar a impressão
              const checkPrintStatus = () => {
                setTimeout(() => {
                  if (!window.matchMedia('print').matches) {
                    window.close();
                  }
                }, 1000);
              };
              
              // Eventos para detectar cancelamento
              window.addEventListener('beforeprint', () => {
                console.log('Preparando para imprimir...');
              });
              
              window.addEventListener('afterprint', () => {
                window.close();
              });
              
              // Verificar se a impressão foi cancelada
              checkPrintStatus();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

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

      // Renderizar o componente React para HTML
      const componentHTML = renderToStaticMarkup(
        <ContratoComponent
          patient={patientWithClinic}
          numeroContrato={patient.id.slice(-6)}
        />,
      );

      const printWindow = window.open(
        "",
        "_blank",
        "width=800,height=600,scrollbars=yes,resizable=yes",
      );
      if (!printWindow) return;

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Contrato - ${patient.name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            ${componentHTML}
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  
                  // Fechar janela após impressão ou cancelamento
                  window.onafterprint = function() {
                    window.close();
                  };
                  
                  // Detectar se a impressão foi cancelada
                  const checkPrintStatus = () => {
                    setTimeout(() => {
                      // Se a janela ainda estiver aberta após 200ms, assume que foi cancelada
                      if (!window.closed) {
                        window.close();
                      }
                    }, 200);
                  };
                  
                  // Detectar eventos de cancelamento
                  window.addEventListener('beforeprint', () => {
                    // Reset do timer quando a impressão inicia
                  });
                  
                  window.addEventListener('afterprint', () => {
                    window.close();
                  });
                  
                  // Backup: fechar após timeout se não houver interação
                  checkPrintStatus();
                  
                }, 1000);
              };
              
              // Fechar janela se o usuário pressionar ESC
              document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                  window.close();
                }
              });
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
    } catch (error) {
      console.error("Erro ao renderizar contrato:", error);
      // Fallback: abrir em nova aba se houver erro
      alert("Erro ao gerar contrato. Tente novamente.");
    }
  };

  const columns = patientsTableColumns({
    onActivate: handleActivate,
    onDelete: handleDelete,
    onPrintCard: handlePrintCard,
    onPrintContract: handlePrintContract,
    sellerId,
    clinicId,
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
          Você ainda não tem pacientes cadastrados ou não há pacientes que
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
        <div className="text-muted-foreground flex-1 text-sm"></div>
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

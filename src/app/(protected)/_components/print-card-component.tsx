"use client";

import { PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { patientsTable } from "@/db/schema";

interface PrintCardComponentProps {
  patient: typeof patientsTable.$inferSelect & {
    seller?: { name: string } | null;
  };
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const PrintCardComponent = ({
  patient,
  variant = "outline",
  size = "sm",
  className = "",
}: PrintCardComponentProps) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Usar a estrutura original do cartão que estava no patients-table.tsx
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

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      className={className}
      title="Imprimir cartão do paciente"
    >
      <PrinterIcon className="h-4 w-4" />
      {size !== "icon" && <span className="ml-1">Imprimir Cartão</span>}
    </Button>
  );
};

export default PrintCardComponent;

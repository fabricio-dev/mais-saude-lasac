"use client";

import { PrinterIcon } from "lucide-react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

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

  const printRef = useRef<HTMLDivElement>(null);

  // Usar a estrutura original do cartão que estava no patients-table.tsx
  const dependents = [
    patient.dependents1,
    patient.dependents2,
    patient.dependents3,
    patient.dependents4,
    patient.dependents5,
    patient.dependents6,
  ].filter(Boolean);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Cartão - ${patient.name}`,
  });

  return (
    <>
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

      {/* Conteúdo para impressão (oculto na tela) */}
      <div className="hidden">
        <div ref={printRef}>
          <style>
            {`
              @media print {
                * {
                  visibility: hidden;
                }
                
                .print-container, .print-container * {
                  visibility: visible;
                }
                
                .print-container {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                
                @page {
                  margin: 0;
                  size: 85.60mm 53.98mm;
                }
                
                body {
                  margin: 0;
                  padding: 0;
                }
                
                .print-card {
                  width: 85.60mm;
                  height: 53.98mm;
                  background: white;
                  border-radius: 10px;
                  padding: 15px;
                  color: black;
                  position: relative;
                  overflow: hidden;
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                  print-color-adjust: exact;
                  font-weight: 500;
                  font-family: 'Arial', 'Helvetica', sans-serif;
                  box-sizing: border-box;
                  margin: 0;
                  display: block;
                }
                
                .print-patient-name {
                  font-size: 12px;
                  font-weight: bold;
                  margin-bottom: 4px;
                  text-transform: uppercase;
                }
                
                .print-dependents {
                  font-size: 10px;
                  margin-bottom: 2px;
                }
                
                .print-dependents-title {
                  font-weight: bold;
                  margin-bottom: 2px;
                }
                
                .print-dependent-item {
                  margin-bottom: 1px;
                  opacity: 0.9;
                }
                
                .print-logo {
                  width: 55px;
                  height: 60px;
                  position: absolute;
                  top: 50px;
                  right: 15px;
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                  print-color-adjust: exact;
                  image-rendering: -webkit-optimize-contrast;
                  image-rendering: -moz-crisp-edges;
                  image-rendering: crisp-edges;
                  image-rendering: high-quality;
                  max-width: none;
                  object-fit: contain;
                  opacity: 1;
                  filter: none;
                }
                
                .print-expiration {
                  position: absolute;
                  bottom: 15px;
                  left: 15px;
                  font-size: 8px;
                  font-weight: bold;
                }
                
                .print-card-type {
                  position: absolute;
                  bottom: 15px;
                  right: 15px;
                  font-size: 8px;
                }
              }
            `}
          </style>

          <div className="print-container">
            <div className="print-card">
              <div className="print-patient-name">TITULAR: {patient.name}</div>

              {dependents.length > 0 && (
                <div className="print-dependents">
                  <div className="print-dependents-title">DEPENDENTES:</div>
                  {dependents.map((dep, index) => (
                    <div key={index} className="print-dependent-item">
                      {dep}
                    </div>
                  ))}
                </div>
              )}

              <img src="/lab.png" alt="Mais Saúde" className="print-logo" />

              <div className="print-expiration">
                {patient.expirationDate
                  ? `VÁLIDO ATÉ: ${formatDate(new Date(patient.expirationDate))}`
                  : ""}
              </div>

              <div className="print-card-type">
                {patient.cardType === "enterprise" ? "EMPRESA" : "INDIVIDUAL"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintCardComponent;

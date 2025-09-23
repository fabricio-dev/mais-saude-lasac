"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";

dayjs.extend(utc);
dayjs.extend(timezone);

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
  activeAt: Date | null;
  reactivatedAt: Date | null;
  seller?: { name: string } | null;
  clinic?: { name: string } | null;
  isActive: boolean;
}

interface ContratoComponentProps {
  patient: Patient;
  numeroContrato?: string;
}

interface PrintableContratoProps {
  patient: Patient;
  numeroContrato?: string;
  onPrintComplete?: () => void;
}

// Funções de formatação
const formatDate = (date: Date | string) => {
  if (!date) return "";

  if (date instanceof Date) {
    // Para Date objects, usar a data UTC (original do banco)
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${day}/${month}/${year}`;
  }

  // Para strings, extrair a parte da data
  const dateStr = date.toString();
  const dateOnly = dateStr.split("T")[0];
  const [year, month, day] = dateOnly.split("-");
  return `${day}/${month}/${year}`;
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

// Componente wrapper que abre a impressão automaticamente
export function PrintableContrato({
  patient,
  numeroContrato,
  onPrintComplete,
}: PrintableContratoProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Contrato - ${patient.name}`,
    onAfterPrint: onPrintComplete,
  });

  useEffect(() => {
    // Aguardar um pouco para o conteúdo renderizar e depois imprimir
    const timer = setTimeout(() => {
      handlePrint();
    }, 500);

    return () => clearTimeout(timer);
  }, [handlePrint]);

  return (
    <div style={{ position: "absolute", left: "-9999px" }}>
      <div ref={printRef}>
        <ContratoComponent patient={patient} numeroContrato={numeroContrato} />
      </div>
    </div>
  );
}

export default function ContratoComponent({
  patient,
  numeroContrato,
}: ContratoComponentProps) {
  return (
    <div className="mx-auto max-w-4xl bg-white p-6 text-sm text-black">
      {/* Cabeçalho */}
      <div className="relative mb-2 flex items-start justify-between">
        <div className="flex-1">
          <img
            src="/mais.png"
            alt="Mais Saúde - Cartão de vantagens"
            className="h-8 w-auto print:h-4"
          />
        </div>

        <div className="text-right">
          <div className="absolute top-0 right-0">
            <img
              src="/lab.png"
              alt="Logo Lasac"
              className="h-20 w-auto object-contain print:h-16"
              style={
                {
                  imageRendering: "auto" as const,
                  maxWidth: "100%",
                  height: "50px",
                } as React.CSSProperties
              }
            />
          </div>
          <div className="mt-16 text-sm">
            <div className="font-bold">
              NÚMERO: {numeroContrato || "6441.52"}
            </div>
            <div className="text-lg font-bold"></div>
          </div>
        </div>
      </div>

      {/* Título */}
      <div className="mb-4 text-center">
        <h1 className="text-lg font-bold">TERMO DE CONVÊNIO</h1>
      </div>

      {/* Texto introdutório */}
      <div
        className="mb-3 text-justify leading-relaxed"
        style={{ fontSize: "14px" }}
      >
        <p>
          Vimos pelo presente termo, formalizar adesão de V. As. junto ao Cartão
          Mais Saúde Lasac a partir da data abaixo citada.
        </p>
        <p className="mt-1">
          Solicitamos observar as seguintes disposições sobre o cartão:
        </p>
      </div>

      {/* Termos */}
      <div
        className="mb-4 text-justify leading-relaxed"
        style={{ fontSize: "13px" }}
      >
        <div className="mb-0">
          <strong>1.</strong> Os usuários pagarão uma taxa única de manutenção
          para aquisição do cartão, que terá VALIDADE ANUAL.
        </div>

        <div className="mb-0">
          <strong>2.</strong> O objetivo do cartão é prestar serviços em
          análises clínicas com a realização de exames laboratoriais com
          descontos especiais e está restrito ao Laboratório Lasac em
          Salgueiro/PE, Juazeiro do Norte/CE e Parnamirim/PE.
        </div>

        <div className="mb-0">
          <strong>3.</strong> Os exames realizados no laboratório Lasac e suas
          unidades serão cobrados diretamente do cliente com descontos de até
          50% dos pagamentos à vista, tendo como referência a tabela AMB 92 com
          CH vigente.
        </div>

        <div className="mb-0">
          <strong>4.</strong> A contratada poderá disponibilizar serviços de
          apoio, gratuitamente aos beneficiários, acesso a convênios especiais
          com profissionais e empresas de diversos ramos de atividade, visando a
          obtenção de melhores preços na aquisição de produtos e/ou serviços.
          Esses serviços disponibilizados pela contratada poderão ser
          acrescidos, alterados ou suspensos parcialmente ou totalmente, a
          qualquer tempo mesmo porque se trata de mera liberalidade que não se
          constitui essência dos serviços hora contratados.
        </div>

        <div className="mb-0">
          <strong>5.</strong> O usuário do cartão só terá as vantagens acima
          citadas mediante a apresentação do CARTÃO MAIS SAÚDE LASAC, sendo ele
          obrigatório.
        </div>

        <div className="mb-0">
          <strong>6.</strong> Este termo terá validade de 30 (trinta) dias após
          a data de sua aquisição, com o mesmo prazo para a entrega do cartão.
        </div>
      </div>

      {/* Concordância */}
      <div className="mb-3 text-justify font-bold" style={{ fontSize: "14px" }}>
        DE ACORDO COM TODOS OS TERMOS ACIMA CITADOS, PREENCHO OS DADOS ABAIXO E
        ASSINO:
      </div>

      {/* Dados do Titular */}
      <div className="mb-3">
        <div className="mb-3 font-bold" style={{ fontSize: "14px" }}>
          NOME TITULAR: {patient.name.toUpperCase()}
        </div>

        {/* Dependentes */}
        {(() => {
          const dependents = [
            patient.dependents1,
            patient.dependents2,
            patient.dependents3,
            patient.dependents4,
            patient.dependents5,
            patient.dependents6,
          ].filter(Boolean);

          return dependents.length > 0 ? (
            <div className="mb-2 rounded border border-gray-400 p-2">
              <div className="space-y-1 text-[12px]">
                {dependents.map((dependent, index) => (
                  <div key={index}>
                    <strong>DEPENDENTE {index + 1}:</strong>{" "}
                    {dependent?.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}
      </div>

      {/* Dados pessoais em tabela */}
      <div className="rounded border border-gray-400 p-2">
        <div className="grid grid-cols-2 text-[10px]">
          <div className="pb-1 pl-2">
            <strong>DATA DE NASCIMENTO:</strong>{" "}
            {patient.birthDate ? formatDate(patient.birthDate) : ""}
          </div>
          <div className="pb-1 pl-2">
            <strong>RG:</strong>{" "}
            {patient.rgNumber ? formatRg(patient.rgNumber) : ""}
          </div>
        </div>
        <div className="grid grid-cols-2 text-[10px]">
          <div className="pt-1 pb-1 pl-2">
            <strong>TELEFONE:</strong> {formatPhone(patient.phoneNumber)}
          </div>
          <div className="pt-1 pb-1 pl-2">
            <strong>CPF:</strong>{" "}
            {patient.cpfNumber ? formatCpf(patient.cpfNumber) : ""}
          </div>
        </div>
        <div className="pt-1 pb-1 pl-2 text-[10px]">
          <strong>ENDEREÇO:</strong>{" "}
          {patient.address ? patient.address.toUpperCase() : ""}
        </div>
        <div className="grid grid-cols-2 text-[10px]">
          <div className="pt-1 pb-1 pl-2">
            <strong>BAIRRO:</strong>{" "}
            {patient.homeNumber ? patient.homeNumber.toUpperCase() : ""}
          </div>
          <div className="pt-1 pb-1 pl-2">
            <strong>CIDADE:</strong>{" "}
            {patient.city ? patient.city.toUpperCase() : ""}{" "}
            {patient.state || ""}
          </div>
        </div>
      </div>

      {/* Dados do contrato */}
      <div className="mb-2 ml-2">
        <div className="grid grid-cols-2 text-[10px]">
          <div className="p-1">
            <strong>DATA DE VENCIMENTO:</strong>{" "}
            {patient.expirationDate
              ? formatDate(patient.expirationDate)
              : "___/___/______"}
          </div>
          <div className="p-1">
            <strong>CIDADE DO CONTRATO:</strong>{" "}
            {patient.clinic?.name.toUpperCase() || "N/A"}
          </div>
        </div>
        <div className="grid grid-cols-2 text-[10px]">
          <div className="p-1">
            <strong>TIPO DE CARTÃO:</strong>{" "}
            {patient.cardType === "enterprise" ? "EMPRESA" : "INDIVIDUAL"}
          </div>
          <div className="p-1">
            <strong>DATA DO CONTRATO:</strong>{" "}
            {formatDate(
              patient.reactivatedAt
                ? patient.reactivatedAt
                : patient.activeAt
                  ? patient.activeAt
                  : new Date(),
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 text-[10px]">
          <div className="p-1">
            <strong>EMPRESA:</strong> {patient.Enterprise?.toUpperCase() || ""}
          </div>
          <div className="p-1">
            <strong>NÚMERO CARTÕES EXTRAS:</strong>{" "}
            {patient.numberCards && patient.numberCards > 1
              ? patient.numberCards - 1
              : 0}
          </div>
        </div>
        <div className="grid grid-cols-2 text-[10px]">
          <div className="p-1">
            <strong>VENDEDOR:</strong>{" "}
            {patient.seller?.name.toUpperCase() || ""}
          </div>
        </div>
      </div>

      {/* Assinatura */}
      <div className="mt-4 text-center">
        <div className="mx-auto w-80 border-b border-black pb-1">
          <div className="h-4"></div>
        </div>
        <div className="mt-1 text-[10px] font-bold">
          Assinatura do Conveniado
        </div>
      </div>

      {/* Estilos para impressão */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 8px;
            line-height: 1.1;
          }
          .container {
            box-shadow: none;
            margin: 0;
            padding: 10px;
            max-width: 100%;
          }
          @page {
            size: A4;
            margin: 0.8cm;
          }
          * {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          h1 {
            font-size: 14px !important;
            margin: 8px 0 !important;
          }
          .text-xs {
            font-size: 7px !important;
          }
          .text-sm {
            font-size: 8px !important;
          }
          img {
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: -moz-crisp-edges !important;
            image-rendering: crisp-edges !important;
            image-rendering: high-quality !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            max-width: none !important;
            width: auto !important;
            height: auto !important;
            opacity: 1 !important;
            filter: none !important;
            object-fit: contain !important;
          }
          img[src="/mais.png"] {
            height: 50px !important;
            width: auto !important;
          }
          img[src="/lab.png"] {
            height: 50px !important;
            width: auto !important;
            image-rendering: high-quality !important;
          }
        }
      `}</style>
    </div>
  );
}

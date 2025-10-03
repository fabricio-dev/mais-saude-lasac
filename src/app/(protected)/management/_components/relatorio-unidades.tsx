"use client";

import "@/styles/print.css";

import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/currency";

import ConveniosVencidosRenovadosChart from "./convenios-vencidos-renovados-chart";
import { DatePicker } from "./date-picker";
import FaturamentoChart from "./faturamento-chart";
import NovosConveniosRenovacaoChart from "./novos-convenios-renovacao-chart";
import PatientsActivationsTable from "./patients-activations-table";
import SelectClinic from "./select-clinic";
import StatsCardsUnidade from "./stats-cards-unidade";

interface PatientActivation {
  id: string;
  name: string;
  activeAt: Date | null;
  reactivatedAt: Date | null;
  expirationDate: Date | null;
  sellerName: string | null;
  clinicName: string | null;
}

interface RelatorioUnidadesProps {
  searchParams: {
    from: string;
    to: string;
    clinicId?: string;
  };
  initialData: {
    faturamentoTotal: number;
    totalConvenios: number;
    conveniosVencidos: number;
    conveniosRenovados: number;
    novosConvenios: number;
    totalPatients: number;
    totalEnterprise: number;
    faturamentoMensal: {
      month: string;
      faturamento: number;
      isWithinPeriod?: boolean;
    }[];
    patientsActivations: PatientActivation[];
  };
}

interface UnidadeData {
  faturamentoTotal: number;
  totalConvenios: number;
  conveniosVencidos: number;
  conveniosRenovados: number;
  novosConvenios: number;
  totalPatients: number;
  totalEnterprise: number;
  faturamentoMensal: {
    month: string;
    faturamento: number;
    isWithinPeriod?: boolean;
  }[];
  patientsActivations: PatientActivation[];
}

const RelatorioUnidades = ({
  searchParams,
  initialData,
}: RelatorioUnidadesProps) => {
  const router = useRouter();
  const [selectedClinic, setSelectedClinic] = useState<string>("all");
  const [selectedClinicName, setSelectedClinicName] =
    useState<string>("Todas as unidades");
  const [reportPeriod, setReportPeriod] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Monitorar mudanças nos parâmetros de data usando nuqs
  const [from] = useQueryState("from", parseAsIsoDate);
  const [to] = useQueryState("to", parseAsIsoDate);
  const [clinicId] = useQueryState("clinicId");
  const [data, setData] = useState<UnidadeData>({
    faturamentoTotal: initialData.faturamentoTotal,
    totalConvenios: initialData.totalConvenios,
    conveniosVencidos: initialData.conveniosVencidos,
    conveniosRenovados: initialData.conveniosRenovados,
    novosConvenios: initialData.novosConvenios,
    totalPatients: initialData.totalPatients,
    totalEnterprise: initialData.totalEnterprise,
    faturamentoMensal: initialData.faturamentoMensal,
    patientsActivations: initialData.patientsActivations,
  });

  // Função de impressão
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Relatório de Unidades - ${new Date().toLocaleDateString("pt-BR")}`,
  });

  // Função para buscar o nome da clínica
  const fetchClinicName = async (clinicId: string) => {
    if (clinicId === "all") {
      setSelectedClinicName("Todas as unidades");
      return;
    }

    try {
      const response = await fetch("/api/clinics");
      if (response.ok) {
        const clinics = await response.json();
        const clinic = clinics.find(
          (c: { id: string; name: string }) => c.id === clinicId,
        );
        setSelectedClinicName(clinic ? clinic.name : "Unidade selecionada");
      }
    } catch (error) {
      console.error("Erro ao buscar nome da clínica:", error);
      setSelectedClinicName("Unidade selecionada");
    }
  };

  // Função para lidar com o carregamento da primeira clínica (Salgueiro como padrão)
  const handleFirstClinicLoaded = (clinicId: string) => {
    if (selectedClinic === "all") {
      handleClinicChange(clinicId);
    }
  };

  // Função para lidar com mudança de clínica
  const handleClinicChange = (clinicId: string) => {
    setSelectedClinic(clinicId);
    setIsLoading(true); // Ativar loading imediatamente

    try {
      const newSearchParams = new URLSearchParams();

      newSearchParams.set("from", searchParams.from);
      newSearchParams.set("to", searchParams.to);

      if (clinicId !== "all") {
        newSearchParams.set("clinicId", clinicId);
      }

      router.push(`/management?${newSearchParams.toString()}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
      setIsLoading(false); // Desativar loading em caso de erro
    }
  };

  // Inicializar clínica selecionada com base nos parâmetros da URL
  useEffect(() => {
    const initializeClinic = async () => {
      try {
        const clinicId = searchParams.clinicId || "all";
        setSelectedClinic(clinicId);

        // Buscar nome da clínica
        await fetchClinicName(clinicId);

        // Formatar período para o relatório
        if (searchParams.from && searchParams.to) {
          const fromDate = new Date(searchParams.from).toLocaleDateString(
            "pt-BR",
          );
          const toDate = new Date(searchParams.to).toLocaleDateString("pt-BR");
          setReportPeriod(`${fromDate} a ${toDate}`);
        }
      } catch (error) {
        console.error("Erro ao inicializar parâmetros:", error);
      }
    };

    initializeClinic();
  }, [searchParams]);

  // Detectar mudanças nos parâmetros de data e ativar loading
  useEffect(() => {
    const currentFromStr = from?.toISOString().split("T")[0];
    const currentToStr = to?.toISOString().split("T")[0];
    const currentClinicId = clinicId || "all";

    // Verificar se os parâmetros atuais são diferentes dos searchParams
    const hasDateChanged =
      currentFromStr !== searchParams.from ||
      currentToStr !== searchParams.to ||
      currentClinicId !== (searchParams.clinicId || "all");

    if (hasDateChanged) {
      setIsLoading(true);
      // O loading será desativado quando os dados forem atualizados no próximo useEffect
    }
  }, [from, to, clinicId, searchParams]);

  // Atualizar dados quando mudamos de dados iniciais (página recarrega com nova clínica)
  useEffect(() => {
    setData({
      faturamentoTotal: initialData.faturamentoTotal,
      totalConvenios: initialData.totalConvenios,
      conveniosVencidos: initialData.conveniosVencidos,
      conveniosRenovados: initialData.conveniosRenovados,
      novosConvenios: initialData.novosConvenios,
      totalPatients: initialData.totalPatients,
      totalEnterprise: initialData.totalEnterprise,
      faturamentoMensal: initialData.faturamentoMensal,
      patientsActivations: initialData.patientsActivations,
    });
    // Desativar loading quando novos dados chegam
    setIsLoading(false);
  }, [initialData]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-full sm:w-[300px]">
            <SelectClinic
              value={selectedClinic}
              onValueChange={handleClinicChange}
              placeholder={
                isLoading ? "Carregando..." : "Selecione uma unidade"
              }
              onFirstClinicLoaded={handleFirstClinicLoaded}
              disabled={isLoading}
            />
          </div>
          <div className="w-full sm:w-auto">
            <DatePicker />
          </div>
        </div>

        {/* Botão de Impressão */}
        <div className="flex justify-end">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="no-print gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir PDF
          </Button>
        </div>
      </div>

      {/* Conteúdo do Relatório */}
      <div ref={printRef}>
        {/* Loader Overlay */}
        {isLoading && (
          <div className="relative">
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <p className="text-sm font-medium text-gray-600">
                  Carregando dados da unidade...
                </p>
              </div>
            </div>
            {/* Skeleton Content */}
            <div className="space-y-6 print:hidden">
              {/* Stats Cards Skeleton */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-lg border p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Skeleton */}
              <div className="bg-card rounded-lg border">
                <div className="p-6">
                  <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-64 w-full animate-pulse rounded bg-gray-200" />
                </div>
              </div>

              {/* Pizza Charts Skeleton */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-lg border">
                    <div className="p-6">
                      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
                      <div className="mx-auto h-48 w-48 animate-pulse rounded-full bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layout para tela (normal) */}
        <div
          className={`space-y-6 print:hidden ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        >
          {/* Cards de estatísticas - versão web */}
          <div className="print-section">
            <StatsCardsUnidade
              faturamentoTotal={data.faturamentoTotal}
              totalPatients={data.totalPatients}
              totalEnterprise={data.totalEnterprise}
              totalConvenios={data.totalConvenios}
              conveniosVencidos={data.conveniosVencidos}
              conveniosRenovados={data.conveniosRenovados}
              novosConvenios={data.novosConvenios}
              isLoading={isLoading}
            />
          </div>

          {/* Gráfico de faturamento mensal */}
          <div className="print-section">
            <FaturamentoChart
              data={data.faturamentoMensal}
              isLoading={isLoading}
            />
          </div>

          {/* Gráficos de pizza */}
          <div className="print-section">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ConveniosVencidosRenovadosChart
                data={{
                  vencidos: data.conveniosVencidos,
                  renovados: data.conveniosRenovados,
                }}
                isLoading={isLoading}
              />
              <NovosConveniosRenovacaoChart
                data={{
                  novosConvenios: data.novosConvenios,
                  renovacoes: data.conveniosRenovados,
                }}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Tabela de Pacientes Ativados/Reativados */}
          <div className="print-section">
            <PatientsActivationsTable
              data={data.patientsActivations}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Layout para impressão - Tabela A4 */}
        <div className="print-table-layout hidden print:table">
          {/* Linha 1: Cabeçalho */}
          <div className="print-header-row">
            <div className="print-header-cell">
              <div className="print-header">
                <h2>Relatório de Unidades</h2>
                <p>
                  {selectedClinicName} | {reportPeriod || "Não especificado"}
                </p>
                <div className="print-stats-grid">
                  <div className="print-stat-item">
                    <span className="print-stat-label">Faturamento Total:</span>
                    <span className="print-stat-value">
                      {formatCurrency(data.faturamentoTotal)}
                    </span>
                  </div>
                  <div className="print-stat-item">
                    <span className="print-stat-label">
                      Venceram no período:
                    </span>
                    <span className="print-stat-value">
                      {(
                        data.conveniosVencidos + data.conveniosRenovados
                      ).toString()}
                    </span>
                  </div>
                  <div className="print-stat-item">
                    <span className="print-stat-label">
                      Renovados no período:
                    </span>
                    <span className="print-stat-value">
                      {data.conveniosRenovados.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="print-stat-item">
                    <span className="print-stat-label">Novos Convenios:</span>
                    <span className="print-stat-value">
                      {data.novosConvenios.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="print-stat-item">
                    <span className="print-stat-label">
                      Total de convênios:
                    </span>
                    <span className="print-stat-value">
                      {data.totalPatients.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Linha 2: Gráfico de Barras */}
          <div className="print-chart-bar-row">
            <div className="print-chart-bar-cell">
              <FaturamentoChart data={data.faturamentoMensal} />
            </div>
          </div>

          {/* Linha 3: Gráficos de Pizza */}
          <div className="print-charts-pizza-row">
            <div className="print-charts-pizza-cell">
              <div className="print-pizza-container">
                <div className="print-pizza-item">
                  <ConveniosVencidosRenovadosChart
                    data={{
                      vencidos: data.conveniosVencidos,
                      renovados: data.conveniosRenovados,
                    }}
                  />
                </div>
                <div className="print-pizza-item">
                  <NovosConveniosRenovacaoChart
                    data={{
                      novosConvenios: data.novosConvenios,
                      renovacoes: data.conveniosRenovados,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatorioUnidades;

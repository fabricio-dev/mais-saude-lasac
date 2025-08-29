"use client";

import "@/styles/print.css";

import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/currency";

import { DatePicker } from "./date-picker";
import DistribuicaoVendasChart from "./distribuicao-vendas-chart";
import FaturamentoMensalChart from "./faturamento-mensal-chart";
import RankingVendedoresChart from "./ranking-vendedores-chart";
import SelectClinicVendedores from "./select-clinic-vendedores";
import SelectVendedor from "./select-vendedor";
import StatsCardsVendedores from "./stats-cards-vendedores";
import TiposConvenioChart from "./tipos-convenio-chart";

interface RelatorioVendedoresProps {
  searchParams?: {
    from: string;
    to: string;
    clinicId?: string;
    vendedorId?: string;
  };
  initialData: {
    totalVendas: number;
    faturamentoTotal: number;
    ticketMedio: number;
    metaAtingida: number;
    comissoesTotais: number;
    vendedorTop: string;
    rankingVendedores: VendedorData[];
    distribuicaoVendas: {
      renovacao: number;
      novo: number;
    };
    tiposConvenio: {
      empresarial: number;
      individual: number;
    };
    faturamentoMensal: FaturamentoMensalData[];
  };
}

interface VendedorData {
  nome: string;
  vendas: number;
  faturamento: number;
  meta: number;
  percentualMeta: number;
  totalConvenios: number;
  conveniosEmpresariais: number;
  renovacoes: number;
  novosConvenios: number;
}

interface FaturamentoMensalData {
  mes: string;
  faturamento: number;
}

interface VendedoresData {
  totalVendas: number;
  faturamentoTotal: number;
  ticketMedio: number;
  metaAtingida: number;
  comissoesTotais: number;
  vendedorTop: string;
  rankingVendedores: VendedorData[];
  distribuicaoVendas: {
    renovacao: number;
    novo: number;
  };
  tiposConvenio: {
    empresarial: number;
    individual: number;
  };
  faturamentoMensal: FaturamentoMensalData[];
}

const RelatorioVendedores = ({
  searchParams,
  initialData,
}: RelatorioVendedoresProps) => {
  const router = useRouter();
  const [selectedClinic, setSelectedClinic] = useState<string>("");
  const [selectedVendedor, setSelectedVendedor] = useState<string>("all");
  const [selectedClinicName, setSelectedClinicName] = useState<string>(
    "Selecione uma unidade",
  );
  const [selectedVendedorName, setSelectedVendedorName] = useState<string>(
    "Todos os vendedores",
  );
  const [reportPeriod, setReportPeriod] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Monitorar mudanças nos parâmetros usando nuqs
  const [from] = useQueryState("from", parseAsIsoDate);
  const [to] = useQueryState("to", parseAsIsoDate);
  const [clinicId] = useQueryState("clinicId");
  const [vendedorId] = useQueryState("vendedorId");

  // Estado dos dados (inicializado com dados reais)
  const [data, setData] = useState<VendedoresData>({
    totalVendas: initialData.totalVendas,
    faturamentoTotal: initialData.faturamentoTotal,
    ticketMedio: initialData.ticketMedio,
    metaAtingida: initialData.metaAtingida,
    comissoesTotais: initialData.comissoesTotais,
    vendedorTop: initialData.vendedorTop,
    rankingVendedores: initialData.rankingVendedores,
    distribuicaoVendas: initialData.distribuicaoVendas,
    tiposConvenio: initialData.tiposConvenio,
    faturamentoMensal: initialData.faturamentoMensal,
  });

  // Função de impressão
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Relatório de Vendedores - ${new Date().toLocaleDateString("pt-BR")}`,
  });

  // Função para buscar o nome da clínica
  const fetchClinicName = async (clinicId: string) => {
    if (!clinicId) {
      setSelectedClinicName("Selecione uma unidade");
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

  // Função para buscar o nome do vendedor
  const fetchVendedorName = async (vendedorId: string) => {
    if (vendedorId === "all") {
      setSelectedVendedorName("Todos os vendedores");
      return;
    }

    try {
      const response = await fetch("/api/sellers");
      if (response.ok) {
        const vendedores = await response.json();
        const vendedor = vendedores.find(
          (v: { id: string; name: string }) => v.id === vendedorId,
        );
        setSelectedVendedorName(
          vendedor ? vendedor.name : "Vendedor selecionado",
        );
      }
    } catch (error) {
      console.error("Erro ao buscar nome do vendedor:", error);
      setSelectedVendedorName("Vendedor selecionado");
    }
  };

  // Função para lidar com mudança de clínica
  const handleClinicChange = (clinicId: string) => {
    setSelectedClinic(clinicId);
    setIsLoading(true); // Ativar loading imediatamente
    // Reset vendedor quando clínica mudar
    setSelectedVendedor("all");
    updateURL({ clinicId, vendedorId: "all" });
  };

  // Função para lidar com mudança de vendedor
  const handleVendedorChange = (vendedorId: string) => {
    setSelectedVendedor(vendedorId);
    setIsLoading(true); // Ativar loading imediatamente
    updateURL({ vendedorId });
  };

  // Função para atualizar URL
  const updateURL = (params: { clinicId?: string; vendedorId?: string }) => {
    try {
      const newSearchParams = new URLSearchParams();

      if (searchParams?.from) newSearchParams.set("from", searchParams.from);
      if (searchParams?.to) newSearchParams.set("to", searchParams.to);

      if (params.clinicId !== undefined) {
        if (params.clinicId) {
          newSearchParams.set("clinicId", params.clinicId);
        }
      } else if (searchParams?.clinicId) {
        newSearchParams.set("clinicId", searchParams.clinicId);
      }

      if (params.vendedorId !== undefined) {
        if (params.vendedorId !== "all") {
          newSearchParams.set("vendedorId", params.vendedorId);
        }
      } else if (searchParams?.vendedorId) {
        newSearchParams.set("vendedorId", searchParams.vendedorId);
      }

      // Adicionar parâmetro para manter na aba de vendedores
      newSearchParams.set("tab", "vendedores");
      router.push(`/management?${newSearchParams.toString()}`);
    } catch (error) {
      console.error("Erro ao navegar:", error);
      setIsLoading(false); // Desativar loading em caso de erro
    }
  };

  // Função para lidar com carregamento da primeira clínica
  const handleFirstClinicLoaded = (clinicId: string) => {
    if (!selectedClinic && !searchParams?.clinicId) {
      setSelectedClinic(clinicId);
      fetchClinicName(clinicId);
    }
  };

  // Inicializar parâmetros
  useEffect(() => {
    const initialize = async () => {
      if (searchParams) {
        const clinicId = searchParams.clinicId || "";
        const vendedorId = searchParams.vendedorId || "all";

        setSelectedClinic(clinicId);
        setSelectedVendedor(vendedorId);

        await Promise.all([
          fetchClinicName(clinicId),
          fetchVendedorName(vendedorId),
        ]);

        if (searchParams.from && searchParams.to) {
          const fromDate = new Date(searchParams.from).toLocaleDateString(
            "pt-BR",
          );
          const toDate = new Date(searchParams.to).toLocaleDateString("pt-BR");
          setReportPeriod(`${fromDate} a ${toDate}`);
        }
      }
    };

    initialize();
  }, [searchParams]);

  // Detectar mudanças nos parâmetros de data e ativar loading
  useEffect(() => {
    if (searchParams) {
      const currentFromStr = from?.toISOString().split("T")[0];
      const currentToStr = to?.toISOString().split("T")[0];
      const currentClinicId = clinicId || "";
      const currentVendedorId = vendedorId || "all";

      const hasChanged =
        currentFromStr !== searchParams.from ||
        currentToStr !== searchParams.to ||
        currentClinicId !== (searchParams.clinicId || "") ||
        currentVendedorId !== (searchParams.vendedorId || "all");

      if (hasChanged) {
        setIsLoading(true);
        // Simular carregamento de dados
        setTimeout(() => setIsLoading(false), 1000);
      }
    }
  }, [from, to, clinicId, vendedorId, searchParams]);

  // Atualizar dados quando mudamos de dados iniciais (página recarrega com novos filtros)
  useEffect(() => {
    setData({
      totalVendas: initialData.totalVendas,
      faturamentoTotal: initialData.faturamentoTotal,
      ticketMedio: initialData.ticketMedio,
      metaAtingida: initialData.metaAtingida,
      comissoesTotais: initialData.comissoesTotais,
      vendedorTop: initialData.vendedorTop,
      rankingVendedores: initialData.rankingVendedores,
      distribuicaoVendas: initialData.distribuicaoVendas,
      tiposConvenio: initialData.tiposConvenio,
      faturamentoMensal: initialData.faturamentoMensal,
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
            <SelectClinicVendedores
              value={selectedClinic}
              onValueChange={handleClinicChange}
              placeholder={
                isLoading ? "Carregando..." : "Selecione uma unidade"
              }
              onFirstClinicLoaded={handleFirstClinicLoaded}
              disabled={isLoading}
            />
          </div>
          <div className="w-full sm:w-[300px]">
            <SelectVendedor
              value={selectedVendedor}
              onValueChange={handleVendedorChange}
              placeholder={
                isLoading ? "Carregando..." : "Selecione um vendedor"
              }
              clinicId={selectedClinic}
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
                  Carregando dados dos vendedores...
                </p>
              </div>
            </div>
            {/* Skeleton Content */}
            <div className="space-y-6 print:hidden">
              {/* Stats Cards Skeleton */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
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

              {/* Table Skeleton */}
              <div className="bg-card rounded-lg border">
                <div className="p-6">
                  <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="space-y-3">
                    {/* Table Header */}
                    <div className="flex space-x-4 border-b pb-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                    </div>
                    {/* Table Rows */}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </div>
                    ))}
                  </div>
                </div>
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
            <StatsCardsVendedores
              totalVendas={data.totalVendas}
              faturamentoTotal={data.faturamentoTotal}
              isLoading={isLoading}
            />
          </div>

          {/* Gráfico de ranking de vendedores OU Faturamento mensal */}
          <div className="print-section">
            {selectedVendedor === "all" ? (
              <RankingVendedoresChart
                data={data.rankingVendedores}
                isLoading={isLoading}
              />
            ) : (
              <FaturamentoMensalChart
                data={data.faturamentoMensal}
                vendedorNome={selectedVendedorName}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Gráficos de pizza */}
          <div className="print-section">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DistribuicaoVendasChart
                data={data.distribuicaoVendas}
                isLoading={isLoading}
              />
              <TiposConvenioChart
                data={data.tiposConvenio}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Tabela de Vendedores - apenas quando "Todos os vendedores" estiver selecionado */}
          {selectedVendedor === "all" && (
            <div className="print-section">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Detalhamento por Vendedor
                </h3>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground text-sm">
                      Carregando dados...
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="p-3 text-left font-medium">
                            Vendedor
                          </th>
                          <th className="p-3 text-center font-medium">
                            Total Convênios
                          </th>
                          <th className="p-3 text-center font-medium">
                            Convênios Empresariais
                          </th>
                          <th className="p-3 text-center font-medium">
                            Renovações
                          </th>
                          <th className="p-3 text-center font-medium">
                            Novos Convênios
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.rankingVendedores.map((vendedor, index) => (
                          <tr
                            key={vendedor.nome}
                            className={`border-b ${
                              index % 2 === 0 ? "bg-white" : "bg-muted/20"
                            }`}
                          >
                            <td className="p-3 font-medium">{vendedor.nome}</td>
                            <td className="p-3 text-center">
                              {vendedor.totalConvenios.toLocaleString("pt-BR")}
                            </td>
                            <td className="p-3 text-center">
                              {vendedor.conveniosEmpresariais.toLocaleString(
                                "pt-BR",
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {vendedor.renovacoes.toLocaleString("pt-BR")}
                            </td>
                            <td className="p-3 text-center">
                              {vendedor.novosConvenios.toLocaleString("pt-BR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Layout para impressão - Tabela A4 */}
        <div
          className={`print-table-layout hidden print:table ${selectedVendedor !== "all" ? "single-page" : ""}`}
        >
          {/* Linha 1: Cabeçalho */}
          <div className="print-header-row">
            <div className="print-header-cell">
              <div className="print-header">
                <h2>Relatório de Vendedores</h2>
                <p>
                  {selectedClinicName} | {selectedVendedorName} |{" "}
                  {reportPeriod || "Não especificado"}
                </p>
                <div className="print-stats-grid">
                  <div className="print-stat-item">
                    <span className="print-stat-label">Total de Vendas:</span>
                    <span className="print-stat-value">
                      {data.totalVendas.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="print-stat-item">
                    <span className="print-stat-label">Faturamento Total:</span>
                    <span className="print-stat-value">
                      {formatCurrency(data.faturamentoTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Linha 2: Gráfico de barras OU Faturamento mensal */}
          <div className="print-chart-bar-row">
            <div className="print-chart-bar-cell">
              {selectedVendedor === "all" ? (
                <RankingVendedoresChart
                  data={data.rankingVendedores}
                  isLoading={false}
                />
              ) : (
                <FaturamentoMensalChart
                  data={data.faturamentoMensal}
                  vendedorNome={selectedVendedorName}
                  isLoading={false}
                />
              )}
            </div>
          </div>

          {/* Linha 3: Gráficos de Pizza */}
          <div
            className={`print-charts-pizza-row ${selectedVendedor !== "all" ? "single-page" : "with-table"}`}
          >
            <div className="print-charts-pizza-cell">
              <div className="print-pizza-container">
                <div className="print-pizza-item">
                  <DistribuicaoVendasChart
                    data={data.distribuicaoVendas}
                    isLoading={false}
                  />
                </div>
                <div className="print-pizza-item">
                  <TiposConvenioChart
                    data={data.tiposConvenio}
                    isLoading={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Linha 4: Tabela de Vendedores - apenas quando "Todos os vendedores" estiver selecionado */}
          {selectedVendedor === "all" && (
            <div className="print-table-row">
              <div className="print-table-cell">
                <div className="print-table-page-header">
                  <h2>Detalhamento por Vendedor</h2>
                  <p>
                    {selectedClinicName} | {selectedVendedorName} |{" "}
                    {reportPeriod || "Não especificado"}
                  </p>
                </div>
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Total Convênios</th>
                      <th>Convênios Empresariais</th>
                      <th>Renovações</th>
                      <th>Novos Convênios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rankingVendedores.map((vendedor) => (
                      <tr key={vendedor.nome}>
                        <td>{vendedor.nome}</td>
                        <td>
                          {vendedor.totalConvenios.toLocaleString("pt-BR")}
                        </td>
                        <td>
                          {vendedor.conveniosEmpresariais.toLocaleString(
                            "pt-BR",
                          )}
                        </td>
                        <td>{vendedor.renovacoes.toLocaleString("pt-BR")}</td>
                        <td>
                          {vendedor.novosConvenios.toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatorioVendedores;

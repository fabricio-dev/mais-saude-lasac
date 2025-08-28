"use client";

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
  clinic?: { name: string } | null;
  isActive: boolean;
  reactivatedAt: Date | null;
  activeAt: Date | null;
}

interface ContratoComponentProps {
  patient: Patient;
  numeroContrato?: string;
}

// Funções de formatação
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

export default function ContratoComponent({
  patient,
  numeroContrato,
}: ContratoComponentProps) {
  return (
    <div className="mx-auto max-w-4xl bg-white p-6 text-sm text-black">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-700">Cartão</span>
          </div>
          <div className="mb-1">
            <span className="text-xl font-bold">+ Saúde</span>
          </div>
          <div className="text-sm text-gray-600">Cartão de vantagens</div>
        </div>

        <div className="text-right">
          <div className="mb-2 flex items-center justify-end">
            <div className="h-20 w-40 print:h-20 print:w-40">
              <img
                src="/logo.svg"
                alt="Logo Lasac"
                className="h-full w-full object-contain"
                style={
                  {
                    imageRendering: "auto" as const,
                    maxWidth: "100%",
                    height: "auto",
                    filter: "contrast(1.1) saturate(1.1)",
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
          <div className="text-sm">
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
      <div className="mb-3 text-xs leading-relaxed">
        <p>
          Vimos pelo presente termo, formalizar adesão de V. As. junto ao Cartão
          Mais Saúde Lasac a partir da data abaixo citada.
        </p>
        <p className="mt-1">
          Solicitamos observar as seguintes disposições sobre o cartão:
        </p>
      </div>

      {/* Termos */}
      <div className="mb-6 text-xs leading-relaxed">
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
      <div className="mb-3 text-xs font-bold">
        DE ACORDO COM TODOS OS TERMOS ACIMA CITADOS, PREENCHO OS DADOS ABAIXO E
        ASSINO:
      </div>

      {/* Dados do Titular */}
      <div className="mb-3">
        <div className="mb-3 text-center text-sm font-bold">
          NOME TITULAR: {patient.name.toUpperCase()}
        </div>

        {/* Dependentes */}
        <div className="mb-2 rounded border border-gray-400 p-2">
          <div className="space-y-1 text-xs">
            <div>
              <strong>DEPENDENTE 1:</strong>{" "}
              {patient.dependents1?.toUpperCase() || ""}
            </div>
            <div>
              <strong>DEPENDENTE 2:</strong>{" "}
              {patient.dependents2?.toUpperCase() || ""}
            </div>
            <div>
              <strong>DEPENDENTE 3:</strong>{" "}
              {patient.dependents3?.toUpperCase() || ""}
            </div>
            <div>
              <strong>DEPENDENTE 4:</strong>{" "}
              {patient.dependents4?.toUpperCase() || ""}
            </div>
            <div>
              <strong>DEPENDENTE 5:</strong>{" "}
              {patient.dependents5?.toUpperCase() || ""}
            </div>
          </div>
        </div>
      </div>

      {/* Dados pessoais em tabela */}
      <div className="mb-2 rounded border border-gray-400">
        <div className="grid grid-cols-2 text-[10px]">
          <div className="p-1">
            <strong>DATA DE NASCIMENTO:</strong>{" "}
            {formatDate(new Date(patient.birthDate))}
          </div>
          <div className="p-1">
            <strong>RG:</strong> {formatRg(patient.rgNumber)}
          </div>
        </div>
        <div className="grid grid-cols-2 text-[10px]">
          <div className="p-1">
            <strong>TELEFONE:</strong> {formatPhone(patient.phoneNumber)}
          </div>
          <div className="p-1">
            <strong>CPF:</strong>{" "}
            {patient.cpfNumber ? formatCpf(patient.cpfNumber) : ""}
          </div>
        </div>
        <div className="p-1 text-[10px]">
          <strong>ENDEREÇO:</strong> {patient.address.toUpperCase()}
        </div>
        <div className="grid grid-cols-2 text-[10px]">
          <div className="p-1">
            <strong>BAIRRO:</strong> {patient.homeNumber.toUpperCase()}
          </div>
          <div className="p-1">
            <strong>CIDADE:</strong> {patient.city.toUpperCase()}{" "}
            {patient.state}
          </div>
        </div>
      </div>

      {/* Dados do contrato */}
      <div className="mb-2">
        <div className="grid grid-cols-2 text-[10px]">
          <div className="p-1">
            <strong>DATA DE VENCIMENTO:</strong>{" "}
            {patient.expirationDate
              ? formatDate(new Date(patient.expirationDate))
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
            <strong>DATA DO CONTRATO:</strong> {formatDate(new Date())}
          </div>
        </div>
        <div className="grid grid-cols-2 text-[10px]">
          <div className="p-1">
            <strong>EMPRESA:</strong> {patient.Enterprise?.toUpperCase() || ""}
          </div>
          <div className="p-1">
            <strong>NÚMERO CARTÕES EXTRAS:</strong>{" "}
            {patient.numberCards > 1 ? patient.numberCards - 1 : 0}
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
            image-rendering: optimizeQuality !important;
            -webkit-image-rendering: optimizeQuality !important;
            -moz-image-rendering: optimizeQuality !important;
            -ms-image-rendering: optimizeQuality !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            max-width: none !important;
            width: auto !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

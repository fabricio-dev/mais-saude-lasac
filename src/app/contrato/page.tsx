"use client";

import { ArrowLeft, FileText, Printer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContratoPage() {
  const handlePrint = () => {
    // Abrir janela de impressão sem barra de menu
    const printWindow = window.open(
      "",
      "_blank",
      "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=800,height=600",
    );
    if (!printWindow) return;

    const contractHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Termo de Convênio - Cartão Mais Saúde LASAC</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #059669;
            padding-bottom: 20px;
          }
          .logo {
            width: 120px;
            height: 80px;
            margin: 0 auto 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #065f46;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 18px;
            font-weight: 600;
            color: #047857;
          }
          .intro {
            background-color: #ecfdf5;
            border: 1px solid #d1fae5;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .clause {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .clause-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
          }
          .clause-number {
            background-color: #059669;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
          }
          .clause-title {
            font-weight: 600;
            color: #065f46;
            font-size: 16px;
          }
          .clause-content {
            text-align: justify;
            line-height: 1.8;
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            text-align: center;
            margin-top: 40px;
          }
          strong {
            font-weight: 600;
            color: #065f46;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">TERMO DE CONVÊNIO</div>
          <div class="subtitle">CARTÃO MAIS SAÚDE LASAC</div>
        </div>

        <div class="intro">
          <p><strong>Vimos pelo presente termo, formalizar adesão de V. As. junto ao Cartão Mais Saúde Lasac a partir da data abaixo citada.</strong></p>
          <p>Solicitamos observar as seguintes disposições sobre o cartão:</p>
        </div>

        <div class="clause">
          <div class="clause-header">
            <div class="clause-number">1</div>
            <div class="clause-title">Taxa e Validade</div>
          </div>
          <div class="clause-content">
            <p>Os usuários pagarão uma taxa única de manutenção para aquisição do cartão que terá <strong>VALIDADE ANUAL</strong>.</p>
          </div>
        </div>

        <div class="clause">
          <div class="clause-header">
            <div class="clause-number">2</div>
            <div class="clause-title">Objetivo e Localidades</div>
          </div>
          <div class="clause-content">
            <p>O objetivo do cartão é prestar serviços em análises clínicas com a realização de exames laboratoriais com descontos especiais e está restrita ao Laboratório Lasac em <strong>Salgueiro/PE, Parnamirim/PE, Serrita/PE, Verdejante/PE, Terra Nova/PE, Custódia/PE, Ouricuri/PE, Penaforte/CE e Barbalha/CE</strong>.</p>
            <p>Os laboratórios LASAC de <strong>Araripina/PE, Cabrobó/PE e Caruaru/PE</strong> já estão com valores promocionais nos exames, mas oferecem desconto adicional aos pacientes conveniados ao Cartão + Saúde LASAC.</p>
          </div>
        </div>

        <div class="clause">
          <div class="clause-header">
            <div class="clause-number">3</div>
            <div class="clause-title">Descontos e Pagamento</div>
          </div>
          <div class="clause-content">
            <p>Os exames realizados no laboratório Lasac e suas unidades serão cobrados diretamente do cliente com descontos de <strong>50% a 60%</strong> nos pagamentos à vista, tendo como referência a <strong>tabela AMB 92 com CH vigente</strong>.</p>
          </div>
        </div>

        <div class="clause">
          <div class="clause-header">
            <div class="clause-number">4</div>
            <div class="clause-title">Serviços Adicionais</div>
          </div>
          <div class="clause-content">
            <p>A contratada poderá disponibilizar serviços de apoio, gratuitamente aos beneficiários, acesso a convênios especiais, firmados com profissionais e empresas de diversos ramos de serviços e produtos; e obtenção de vantagens na aquisição de produtos e/ou serviços. Esses serviços disponibilizados pela contratada poderão ser acrescidos, alterados e suspensos parcialmente ou totalmente, a qualquer tempo mesmo porque se trata de mera liberalidade que não se constitui essência dos serviços hora contratados.</p>
          </div>
        </div>

        <div class="clause">
          <div class="clause-header">
            <div class="clause-number">5</div>
            <div class="clause-title">Apresentação Obrigatória</div>
          </div>
          <div class="clause-content">
            <p>O usuário do cartão só terá as vantagens acima citadas mediante a apresentação do <strong>CARTÃO MAIS SAÚDE LASAC</strong>, sendo ele obrigatório.</p>
          </div>
        </div>

        <div class="clause">
          <div class="clause-header">
            <div class="clause-number">6</div>
            <div class="clause-title">Prazo de Validade</div>
          </div>
          <div class="clause-content">
            <p>Este termo terá validade de <strong>30 (trinta) dias</strong> após a data de sua aquisição, com o mesmo prazo para a entrega do cartão.</p>
          </div>
        </div>

        <div class="footer">
          <p><strong>© ${new Date().getFullYear()} Laboratório Lasac. Todos os direitos reservados.</strong></p>
          <p>Este documento é válido e possui valor legal para fins de adesão ao convênio.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(contractHTML);
    printWindow.document.close();

    // Aguardar um pouco para o conteúdo carregar e depois imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-200">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-emerald-500 px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/convenio">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-32 items-center justify-center">
              <Image
                src="/logo03.svg"
                alt="Mais Saúde Lasac Logo"
                width={120}
                height={80}
                className="rounded-sm object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-900">
              TERMO DE CONVÊNIO
            </CardTitle>
            <div className="mt-2 text-lg font-semibold text-emerald-700">
              CARTÃO MAIS SAÚDE LASAC
            </div>
          </CardHeader>

          <CardContent className="space-y-6 text-gray-800">
            {/* Introdução */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-justify leading-relaxed">
                Vimos pelo presente termo, formalizar adesão de V. As. junto ao{" "}
                <strong>Cartão Mais Saúde Lasac</strong> a partir da data abaixo
                citada.
              </p>
              <p className="mt-3 text-justify leading-relaxed">
                Solicitamos observar as seguintes disposições sobre o cartão:
              </p>
            </div>

            {/* Cláusulas */}
            <div className="space-y-6">
              {/* Cláusula 1 */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    1
                  </div>
                  <h3 className="font-semibold text-emerald-900">
                    Taxa e Validade
                  </h3>
                </div>
                <p className="text-justify leading-relaxed">
                  Os usuários pagarão uma taxa única de manutenção para
                  aquisição do cartão que terá <strong>VALIDADE ANUAL</strong>.
                </p>
              </div>

              {/* Cláusula 2 */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    2
                  </div>
                  <h3 className="font-semibold text-emerald-900">
                    Objetivo e Localidades
                  </h3>
                </div>
                <p className="mb-3 text-justify leading-relaxed">
                  O objetivo do cartão é prestar serviços em análises clínicas
                  com a realização de exames laboratoriais com descontos
                  especiais e está restrita ao Laboratório Lasac em{" "}
                  <strong>
                    Salgueiro/PE, Parnamirim/PE, Serrita/PE, Verdejante/PE,
                    Terra Nova/PE, Custódia/PE, Ouricuri/PE, Penaforte/CE e
                    Barbalha/CE
                  </strong>
                  .
                </p>
                <p className="text-justify leading-relaxed">
                  Os laboratórios LASAC de{" "}
                  <strong>Araripina/PE, Cabrobó/PE e Caruaru/PE</strong> já
                  estão com valores promocionais nos exames, mas oferecem
                  desconto adicional aos pacientes conveniados ao Cartão + Saúde
                  LASAC.
                </p>
              </div>

              {/* Cláusula 3 */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    3
                  </div>
                  <h3 className="font-semibold text-emerald-900">
                    Descontos e Pagamento
                  </h3>
                </div>
                <p className="text-justify leading-relaxed">
                  Os exames realizados no laboratório Lasac e suas unidades
                  serão cobrados diretamente do cliente com descontos de{" "}
                  <strong>50% a 60%</strong> nos pagamentos à vista, tendo como
                  referência a <strong>tabela AMB 92 com CH vigente</strong>.
                </p>
              </div>

              {/* Cláusula 4 */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    4
                  </div>
                  <h3 className="font-semibold text-emerald-900">
                    Serviços Adicionais
                  </h3>
                </div>
                <p className="text-justify leading-relaxed">
                  A contratada poderá disponibilizar serviços de apoio,
                  gratuitamente aos beneficiários, acesso a convênios especiais,
                  firmados com profissionais e empresas de diversos ramos de
                  serviços e produtos; e obtenção de vantagens na aquisição de
                  produtos e/ou serviços. Esses serviços disponibilizados pela
                  contratada poderão ser acrescidos, alterados e suspensos
                  parcialmente ou totalmente, a qualquer tempo mesmo porque se
                  trata de mera liberalidade que não se constitui essência dos
                  serviços hora contratados.
                </p>
              </div>

              {/* Cláusula 5 */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    5
                  </div>
                  <h3 className="font-semibold text-emerald-900">
                    Apresentação Obrigatória
                  </h3>
                </div>
                <p className="text-justify leading-relaxed">
                  O usuário do cartão só terá as vantagens acima citadas
                  mediante a apresentação do{" "}
                  <strong>CARTÃO MAIS SAÚDE LASAC</strong>, sendo ele
                  obrigatório.
                </p>
              </div>

              {/* Cláusula 6 */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                    6
                  </div>
                  <h3 className="font-semibold text-emerald-900">
                    Prazo de Validade
                  </h3>
                </div>
                <p className="text-justify leading-relaxed">
                  Este termo terá validade de <strong>30 (trinta) dias</strong>{" "}
                  após a data de sua aquisição, com o mesmo prazo para a entrega
                  do cartão.
                </p>
              </div>
            </div>

            {/* Rodapé */}
            <div className="border-t border-gray-200 pt-6 text-center">
              <div className="mb-4">
                <FileText className="mx-auto h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} Laboratório Lasac. Todos os
                direitos reservados.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Este documento é válido e possui valor legal para fins de adesão
                ao convênio.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

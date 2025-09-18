"use client";

import { motion } from "framer-motion";
import {
  CreditCard,
  Facebook,
  FileText,
  Hand,
  IdCard,
  Instagram,
  Linkedin,
  Mouse,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Interface para os dados do paciente retornados do banco
interface PacienteDb {
  id: string;
  name: string;
  cpfNumber: string;
  Enterprise: string | null;
  cardType: "enterprise" | "personal";
  numberCards: number;
  expirationDate: Date | null;
  isActive: boolean;
  dependents1: string | null;
  dependents2: string | null;
  dependents3: string | null;
  dependents4: string | null;
  dependents5: string | null;
  dependents6: string | null;
}

// Schema de validação com Zod
const consultaConvenioSchema = z.object({
  cpf: z
    .string()
    .min(1, "CPF ou nome é obrigatório")
    .refine(
      (value) => {
        const trimmed = value.trim();
        const numbers = value.replace(/\D/g, "");

        // Se contém apenas números (CPF), deve ter 11 dígitos
        if (
          numbers.length > 0 &&
          numbers.length === value.replace(/[\s.-]/g, "").length
        ) {
          return numbers.length === 11;
        }

        // Se contém letras (nome do titular ou dependente), deve ter pelo menos 2 caracteres
        return trimmed.length >= 2;
      },
      {
        message:
          "Digite um CPF válido (11 dígitos) ou um nome (titular ou dependente) com pelo menos 2 caracteres",
      },
    )
    .refine(
      (value) => {
        const numbers = value.replace(/\D/g, "");

        // Se não é um CPF (contém letras ou não tem 11 dígitos), pula a validação
        if (
          numbers.length !== 11 ||
          numbers.length !== value.replace(/[\s.-]/g, "").length
        ) {
          return true;
        }

        const cpf = numbers;

        // Validação básica de CPF
        if (cpf.length !== 11) return false;

        // Evita sequências como 111.111.111-11
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        // Algoritmo de validação do CPF
        let sum = 0;
        let remainder;

        // Calcula o primeiro dígito verificador
        for (let i = 1; i <= 9; i++) {
          sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }

        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(9, 10))) return false;

        // Calcula o segundo dígito verificador
        sum = 0;
        for (let i = 1; i <= 10; i++) {
          sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }

        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.substring(10, 11))) return false;

        return true;
      },
      {
        message: "CPF inválido",
      },
    ),
  consentimento: z.boolean().refine((value) => value === true, {
    message: "Você deve concordar com os termos de uso",
  }),
});

type ConsultaConvenioForm = z.infer<typeof consultaConvenioSchema>;

// Tipagem de convênio
interface Convenio {
  nome: string;
  empresa: string;

  validade: string;
  validadeOriginal?: Date | null;
  tipo: string;
  dependentes?: string[];
}

export default function Home() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [semResultados, setSemResultados] = useState(false);
  const [consentimento, setConsentimento] = useState(false);

  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<
    Partial<Record<keyof ConsultaConvenioForm, string>>
  >({});

  // Estados para o diálogo de geração de cartão
  const [dialogAberto, setDialogAberto] = useState(false);
  const [cpfCartao, setCpfCartao] = useState("");
  const [consentimentoCartao, setConsentimentoCartao] = useState(false);
  const [loadingCartao, setLoadingCartao] = useState(false);
  const [errorsCartao, setErrorsCartao] = useState<{
    cpf?: string;
    consentimento?: string;
  }>({});

  // Função auxiliar para verificar se convênio está ativo
  const isConvenioAtivo = (
    validadeOriginal: Date | null | undefined,
  ): boolean => {
    if (!validadeOriginal) return false;

    const validadeDate = new Date(validadeOriginal);
    const hoje = new Date();

    // Zerar horário para comparar apenas a data
    const validadeSemHora = new Date(
      validadeDate.getFullYear(),
      validadeDate.getMonth(),
      validadeDate.getDate(),
    );
    const hojeSemHora = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
    );

    return validadeSemHora > hojeSemHora;
  };

  // Função auxiliar para obter status do convênio
  const getStatusConvenio = (
    validadeOriginal: Date | null | undefined,
  ): string => {
    if (!validadeOriginal) return "Indefinido";
    return isConvenioAtivo(validadeOriginal) ? "Ativo" : "Vencido";
  };

  // Função auxiliar para obter classe CSS do status
  const getStatusClassName = (
    validadeOriginal: Date | null | undefined,
  ): string => {
    if (!validadeOriginal) return "bg-gray-100 text-gray-800";
    return isConvenioAtivo(validadeOriginal)
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  // Função para aplicar máscara de CPF (apenas se for CPF)
  const formatCpf = (value: string) => {
    // Se contém letras, retorna sem formatação
    if (/[a-zA-ZÀ-ÿ]/.test(value)) {
      return value;
    }

    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  async function realizarConsulta(formData: ConsultaConvenioForm) {
    // Reset estados
    setErrors({});
    setSemResultados(false);
    setConvenios([]);
    setLoading(true);

    try {
      // Chamada para API que usa Drizzle
      const response = await fetch("/api/consultar-pacientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termo: formData.cpf,
        }),
      });

      const resultado = await response.json();

      if (!resultado.success) {
        console.error("Erro na consulta:", resultado.error);
        setSemResultados(true);
        return;
      }

      // Se encontrou pacientes, exibir
      if (resultado.data && resultado.data.length > 0) {
        // Mapear dados do banco para interface do componente
        const pacientesFormatados = resultado.data.map(
          (paciente: PacienteDb) => {
            // Coleta dependentes que não são nulos
            const dependentes = [
              paciente.dependents1,
              paciente.dependents2,
              paciente.dependents3,
              paciente.dependents4,
              paciente.dependents5,
              paciente.dependents6,
            ].filter((dep) => dep !== null && dep !== "" && dep?.trim() !== "");

            return {
              nome: paciente.name,
              empresa: paciente.Enterprise,
              isActive: paciente.isActive,
              validade: paciente.expirationDate
                ? new Date(paciente.expirationDate).toLocaleDateString("pt-BR")
                : "Não informado",
              validadeOriginal: paciente.expirationDate, // Manter data original para comparação
              tipo: `${paciente.cardType === "enterprise" ? "Empresa" : "Individual"}`,
              dependentes: dependentes.length > 0 ? dependentes : undefined,
            };
          },
        );

        setConvenios(pacientesFormatados);
      } else {
        setSemResultados(true);
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      setSemResultados(true);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação com Zod
    const formData = {
      cpf: cpf,
      consentimento: consentimento,
    };

    const validation = consultaConvenioSchema.safeParse(formData);

    if (!validation.success) {
      // Mapear erros do Zod para o estado
      const fieldErrors: Partial<Record<keyof ConsultaConvenioForm, string>> =
        {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof ConsultaConvenioForm] =
            error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Se validação passou, realizar consulta
    realizarConsulta(validation.data);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);

    // Limpar erro do CPF quando usuário digitar
    if (errors.cpf) {
      setErrors((prev) => ({ ...prev, cpf: undefined }));
    }
  };

  const handleConsentimentoChange = (checked: boolean) => {
    setConsentimento(checked);

    // Limpar erro do consentimento quando usuário marcar
    if (errors.consentimento) {
      setErrors((prev) => ({ ...prev, consentimento: undefined }));
    }
  };

  const handleCardClick = (cardIndex: number) => {
    console.log("Card clicked:", cardIndex);
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardIndex)) {
        newSet.delete(cardIndex);
        console.log("Card unflipped:", cardIndex);
      } else {
        newSet.add(cardIndex);
        console.log("Card flipped:", cardIndex);
      }
      console.log("New flipped cards:", Array.from(newSet));
      return newSet;
    });
  };

  // Função para abrir o diálogo de geração de cartão
  const abrirDialogoCartao = () => {
    setDialogAberto(true);
    setCpfCartao("");
    setConsentimentoCartao(false);
    setErrorsCartao({});
  };

  // Função para fechar o diálogo
  const fecharDialogoCartao = () => {
    setDialogAberto(false);
    setCpfCartao("");
    setConsentimentoCartao(false);
    setErrorsCartao({});
  };

  // Função para formatar CPF
  const formatCpfCartao = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  // Função para gerar cartão PDF
  const gerarCartaoPdf = async () => {
    // Validação
    const newErrors: { cpf?: string; consentimento?: string } = {};

    if (!cpfCartao.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else {
      const numbers = cpfCartao.replace(/\D/g, "");
      if (numbers.length !== 11) {
        newErrors.cpf = "CPF deve ter 11 dígitos";
      }
    }

    if (!consentimentoCartao) {
      newErrors.consentimento = "Você deve concordar com os termos";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrorsCartao(newErrors);
      return;
    }

    setLoadingCartao(true);

    try {
      // Buscar paciente no banco
      const response = await fetch("/api/consultar-pacientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          termo: cpfCartao.replace(/\D/g, ""),
        }),
      });

      const resultado = await response.json();

      if (
        !resultado.success ||
        !resultado.data ||
        resultado.data.length === 0
      ) {
        setErrorsCartao({ cpf: "CPF não encontrado no sistema" });
        return;
      }

      const paciente = resultado.data[0]; // Pegar o primeiro paciente encontrado

      // Gerar cartão com duas faces
      gerarCartaoDuasFaces(paciente);

      // Fechar diálogo após sucesso
      fecharDialogoCartao();
    } catch (error) {
      console.error("Erro ao buscar paciente:", error);
      setErrorsCartao({ cpf: "Erro ao consultar dados. Tente novamente." });
    } finally {
      setLoadingCartao(false);
    }
  };

  // Função para gerar cartão com duas faces
  const gerarCartaoDuasFaces = (paciente: PacienteDb) => {
    const printWindow = window.open("", "");
    if (!printWindow) return;

    const dependents = [
      paciente.dependents1,
      paciente.dependents2,
      paciente.dependents3,
      paciente.dependents4,
      paciente.dependents5,
      paciente.dependents6,
    ].filter(Boolean);

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString("pt-BR");
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartão ${paciente.name}</title>
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
              flex-direction: column;
              align-items: center;
              padding: 20px;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
            
            .card {
              width: 85.60mm;
              height: 53.98mm;
              background: white;
              border: 1px solid #d1d5db;
              border-radius: 10px;
              margin-bottom: 20px;
              box-shadow: 0 8px 16px rgba(0,0,0,0.3);
              position: relative;
              overflow: hidden;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              page-break-inside: avoid;
            }
            
                                    /* Face 1 - Logo */
            .face1 {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0;
              background: white;
              color: black;
              width: 100%;
              height: 100%;
              border: none !important;
            }
            
            .logo-container {
              text-align: center;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
                        .logo-img {
              width: 85.60mm;
              height: 53.98mm;
              object-fit: cover;
              display: block;
              border-radius: 10px;
              border: 1px solid #d1d5db;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
              image-rendering: pixelated;
              filter: contrast(1.2) brightness(1.1);
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            .card-title-face1 {
              font-size: 18px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            
            /* Face 2 - Dados */
            .face2 {
              padding: 15px;
              color: black;
              font-weight: 500;
            }
            
            .card-header {
              text-align: center;
              margin-bottom: 8px;
              position: relative;
              z-index: 1;
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
            
            .card-footer {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 20px;
              font-size: 6px;
              opacity: 0.7;
            }
            
            .logo-face2 {
              width: 40px;
              height: 40px;
              position: absolute;
              top: 15px;
              right: 15px;
              image-rendering: auto;
              image-rendering: -webkit-optimize-contrast;
              image-rendering: pixelated;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              filter: contrast(1.2);
              max-width: none;
              max-height: none;
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
                margin-bottom: 1cm;
                page-break-inside: avoid;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                border: 1px solid #d1d5db !important;
              }
              
              .face1 {
                border: none !important;
              }
              
              .logo-img {
                width: 85.60mm !important;
                height: 53.98mm !important;
                object-fit: cover !important;
                border: 1px solid #d1d5db !important;
                border-radius: 10px !important;
                image-rendering: -webkit-optimize-contrast !important;
                image-rendering: crisp-edges !important;
                image-rendering: pixelated !important;
                filter: contrast(1.1) brightness(1.1) !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              @page {
                margin: 1cm;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          <!-- Face 1 - Logo -->
          <div class="card face1">
            <div class="logo-container">
              <img src="/logo03.svg" alt="Mais Saúde" class="logo-img">
             
            </div>
          </div>
          
          <!-- Face 2 - Dados -->
          <div class="card face2">
            <div class="card-header"></div>
            <div class="card-content">
              <div class="patient-name">TITULAR: ${paciente.name}</div>
              
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
              
              <img src="/lab.svg" alt="Mais Saúde" class="logo-face2">
            </div>
            
            <div class="card-footer">
              <div style="position: absolute; bottom: 15px; left: 15px; font-size: 8px; font-weight: bold;">
                ${paciente.expirationDate ? `VÁLIDO ATÉ: ${formatDate(new Date(paciente.expirationDate))}` : ""}
              </div>
              <div style="position: absolute; bottom: 15px; right: 15px;">
                ${paciente.cardType === "enterprise" ? "EMPRESA" : "INDIVIDUAL"}
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
    <div className="min-h-screen bg-emerald-500 from-blue-50 via-indigo-100 to-purple-200">
      {/* Header com botões */}
      <header className="absolute top-0 right-0 p-6 pr-1">
        <div className="flex gap-3">
          <Link href="/convenio">
            <Button
              variant="outline"
              className="bg-emerald-600/90 text-white backdrop-blur-sm hover:bg-emerald-700/90"
            >
              Seja Conveniado
            </Button>
          </Link>

          <Button
            variant="outline"
            className="bg-emerald-600/30 text-white backdrop-blur-sm hover:bg-emerald-700/90"
            onClick={abrirDialogoCartao}
          >
            <CreditCard className="h-4 w-4" />
            Meu Cartão
          </Button>

          <Link href="/authentication" className="pr-2">
            <Button
              variant="outline"
              className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
            >
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Seção principal */}
      <div className="bg-emerald-500 from-indigo-600 to-emerald-500 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 flex justify-center pt-10">
              <div className="flex h-32 w-48 items-center justify-center rounded-lg">
                <Image
                  src="/logo03.svg"
                  alt="Mais Saúde Lasac Logo"
                  width={200}
                  height={150}
                  className="h-full w-full rounded-lg object-contain"
                />
              </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">
              Consulta de Benefícios
            </h1>
            <p className="text-white/90">
              Verifique seus convênios e benefícios utilizando CPF, nome do
              titular ou nome de dependente
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label
                      htmlFor="cpf"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      CPF, Nome do Titular ou Dependente
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        id="cpf"
                        name="cpf"
                        placeholder="123.456.789-09 ou Maria Silva"
                        value={cpf}
                        onChange={handleCpfChange}
                        className={`pr-10 ${errors.cpf ? "border-red-500" : ""}`}
                        maxLength={60}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <IdCard className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    {errors.cpf && (
                      <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center">
                      <input
                        id="consentimento"
                        name="consentimento"
                        type="checkbox"
                        checked={consentimento}
                        onChange={(e) =>
                          handleConsentimentoChange(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        htmlFor="consentimento"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Concordo com os termos de uso e política de privacidade
                      </label>
                    </div>
                    {errors.consentimento && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.consentimento}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {loading ? "Consultando..." : "Consultar Benefícios"}
                  </Button>
                </form>

                {/* Resultados */}
                {convenios.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <h2 className="mb-4 text-xl font-semibold text-gray-800">
                      Convênios encontrados
                    </h2>
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                      {convenios.map((conv, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className="group relative mx-auto aspect-[1.586/1] w-full max-w-lg cursor-pointer transition-transform active:scale-95 md:active:scale-100"
                          style={{ perspective: "1000px" }}
                          onClick={() => handleCardClick(i)}
                        >
                          <div
                            className={`relative h-full w-full transition-transform duration-700 ${
                              flippedCards.has(i)
                                ? "[transform:rotateY(180deg)] md:[transform:rotateY(180deg)]"
                                : "md:group-hover:[transform:rotateY(180deg)]"
                            }`}
                            style={{
                              transformStyle: "preserve-3d",
                              WebkitTransformStyle: "preserve-3d",
                            }}
                          >
                            {/* Face frontal - Logo */}
                            <div
                              className={`absolute inset-0 rounded-xl shadow-lg ${
                                flippedCards.has(i)
                                  ? "hidden md:block"
                                  : "block"
                              }`}
                              style={{
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                backgroundImage: `url('/logo03.svg')`,
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "cover",
                                backgroundColor: "#f8fafc",
                              }}
                            >
                              {/* Overlay para controlar a transparência do logo */}
                              <div className="absolute inset-0 rounded-xl border border-gray-200 bg-white/90"></div>

                              <div className="relative z-10 flex h-full flex-col justify-between p-2">
                                <div className="text-center">
                                  <div className="inline-block rounded-lg px-2 py-1 md:px-4 md:py-2">
                                    <h3 className="pt-2 text-lg font-bold text-gray-800 md:pt-4 md:text-xl">
                                      {conv.nome}
                                    </h3>
                                  </div>
                                </div>

                                <div className="space-y-2 md:space-y-4">
                                  <span
                                    className={`block rounded px-2 py-1 text-center text-xs font-medium md:px-3 md:py-2 md:text-sm ${getStatusClassName(conv.validadeOriginal)}`}
                                  >
                                    <p className="text-xs md:text-sm">
                                      Status:{" "}
                                      {getStatusConvenio(conv.validadeOriginal)}
                                    </p>

                                    <p className="text-xs font-medium text-gray-600 md:text-sm">
                                      Vencimento: {conv.validade}
                                    </p>
                                  </span>

                                  <p className="mt-2 rounded-lg px-2 py-1 text-center text-xs font-bold text-gray-600 md:mt-3 md:px-4 md:py-2 md:text-sm">
                                    <span className="hidden items-center justify-center gap-1 md:flex">
                                      <Mouse className="h-4 w-4" />
                                      Passe o mouse para ver mais detalhes
                                    </span>
                                    <span className="flex items-center justify-center gap-1 md:hidden">
                                      <Hand className="h-3 w-3" />
                                      Toque para ver mais detalhes
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Face traseira - Informações */}
                            <div
                              className={`absolute inset-0 rounded-xl border border-gray-400 bg-white shadow-lg md:p-3 md:pl-6 ${
                                flippedCards.has(i)
                                  ? "block"
                                  : "hidden md:block"
                              }`}
                              style={{
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                              }}
                            >
                              <div className="flex h-full flex-col justify-between">
                                <div>
                                  <h3 className="mb-1 text-base font-semibold text-gray-800 md:mb-0 md:text-lg">
                                    {conv.nome}
                                  </h3>

                                  <div className="mb-0 space-y-1 md:mb-0 md:space-y-2">
                                    <div className="text-sm text-gray-600 md:text-base">
                                      {(conv.tipo === "Empresa" &&
                                        conv.empresa && (
                                          <p className="text-sm text-gray-600 md:text-base">
                                            <span className="font-medium">
                                              Tipo:
                                            </span>{" "}
                                            {conv.tipo} {": "}
                                            {conv.empresa}
                                          </p>
                                        )) || (
                                        <p className="text-sm text-gray-600 md:text-base">
                                          <span className="font-medium">
                                            Tipo:
                                          </span>{" "}
                                          {conv.tipo}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {conv.dependentes &&
                                    conv.dependentes.length > 0 && (
                                      <div className="mb-1 gap-1 md:mb-2 md:gap-2">
                                        <p className="text-sm font-medium text-gray-700 md:text-base">
                                          Dependentes:
                                        </p>
                                        <div>
                                          {conv.dependentes.map(
                                            (dependente, idx) => (
                                              <div
                                                key={idx}
                                                className="flex items-center text-sm text-gray-600 md:text-sm"
                                              >
                                                <span className="mr-1">•</span>
                                                <span className="truncate">
                                                  {dependente}
                                                </span>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="text-gray-600">Buscando informações...</p>
                  </div>
                )}

                {/* Sem resultados */}
                {semResultados && !loading && (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4">
                      <Search className="h-16 w-16 text-gray-400" />
                    </div>
                    <h3 className="mb-1 text-lg font-medium text-gray-700">
                      Nenhum convênio encontrado
                    </h3>
                    <p className="text-gray-500">
                      Não encontramos benefícios associados a este CPF ou nome.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Seção "Como funciona" */}
      <div className="mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 text-center"
        >
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            Como funciona?
          </h2>
          <p className="mx-auto max-w-2xl text-gray-600">
            Nosso sistema opera em parceria com diversas instituições para
            garantir a melhor experiência para nossos clientes.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 text-2xl text-indigo-600">
              <IdCard className="h-8 w-8" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-800">
              Informe seu CPF, Nome ou Nome do Dependente
            </h3>
            <p className="text-gray-600">
              Digite seu CPF no formato correto, seu nome completo ou o nome de
              um dependente para realizar a consulta.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 text-2xl text-indigo-600">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-800">
              Consulta integrada
            </h3>
            <p className="text-gray-600">
              Nossa plataforma buscará em todas as instituições conveniadas.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 text-2xl text-indigo-600">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-800">
              Resultados completos
            </h3>
            <p className="text-gray-600">
              Veja todos seus benefícios com detalhes de cobertura e validade.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 py-8 text-white">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 flex items-center justify-center gap-4">
              <a
                href="https://www.facebook.com/profile.php?id=100093100000000"
                className="transition hover:text-indigo-300"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/laboratoriolasac/"
                className="transition hover:text-indigo-300"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/laboratorio-lasac/"
                className="transition hover:text-indigo-300"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
            <p>
              © 2025 Laboratório Lasac. Todos os direitos reservados. Powered
              by{" "}
              <a
                href="https://www.sertaosoftware.com.br"
                className="transition hover:text-indigo-300"
              >
                Sertao Software
              </a>
            </p>
            <p className="mt-2">
              <a
                href="https://www.google.com"
                className="transition hover:text-indigo-300"
              >
                Termos de uso
              </a>{" "}
              |{" "}
              <a
                href="https://www.google.com"
                className="transition hover:text-indigo-300"
              >
                Política de privacidade
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Diálogo para gerar cartão PDF */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gerar Cartão em PDF
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cpf-cartao" className="text-sm font-medium">
                CPF do Titular
              </Label>
              <Input
                id="cpf-cartao"
                type="text"
                placeholder="000.000.000-00"
                value={cpfCartao}
                onChange={(e) => {
                  const formatted = formatCpfCartao(e.target.value);
                  setCpfCartao(formatted);
                  if (errorsCartao.cpf) {
                    setErrorsCartao((prev) => ({ ...prev, cpf: undefined }));
                  }
                }}
                className={errorsCartao.cpf ? "border-red-500" : ""}
                maxLength={14}
              />
              {errorsCartao.cpf && (
                <p className="mt-1 text-sm text-red-600">{errorsCartao.cpf}</p>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <input
                  id="consentimento-cartao"
                  type="checkbox"
                  checked={consentimentoCartao}
                  onChange={(e) => {
                    setConsentimentoCartao(e.target.checked);
                    if (errorsCartao.consentimento) {
                      setErrorsCartao((prev) => ({
                        ...prev,
                        consentimento: undefined,
                      }));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="consentimento-cartao" className="text-sm">
                  Concordo com os termos de uso e política de privacidade
                </Label>
              </div>
              {errorsCartao.consentimento && (
                <p className="mt-1 text-sm text-red-600">
                  {errorsCartao.consentimento}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={fecharDialogoCartao}
                className="flex-1"
                disabled={loadingCartao}
              >
                Cancelar
              </Button>
              <Button
                onClick={gerarCartaoPdf}
                disabled={loadingCartao}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loadingCartao ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Cartão
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

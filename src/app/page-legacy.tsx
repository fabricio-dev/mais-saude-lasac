"use client";

import {
  CreditCard,
  Facebook,
  FileText,
  IdCard,
  Instagram,
  Linkedin,
  Menu,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function HomeLegacy() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [semResultados, setSemResultados] = useState(false);
  const [consentimento, setConsentimento] = useState(false);
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
    if (!validadeOriginal) return "status-indefinido";
    return isConvenioAtivo(validadeOriginal)
      ? "status-ativo"
      : "status-vencido";
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
              font-family: Arial, Helvetica, sans-serif;
              background-color: #f0f0f0;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
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
              page-break-inside: avoid;
            }
            
            /* Face 1 - Logo */
            .face1 {
              margin-top: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0;
              background: white;
              color: black;
              border: none;
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
            }
            
            @media print {
              body {
                background-color: white;
                margin: 0;
                padding: 0;
              }
              
              .card {
                box-shadow: none;
                margin-bottom: 1cm;
                page-break-inside: avoid;
                border: 1px solid #d1d5db;
              }
              
              .logo-img {
                width: 85.60mm;
                height: 53.98mm;
                object-fit: cover;
                border: 1px solid #d1d5db;
                border-radius: 10px;
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
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
              
              // Fechar janela se o usuário cancelar a impressão
              var checkPrintStatus = function() {
                setTimeout(function() {
                  if (!window.matchMedia('print').matches) {
                    window.close();
                  }
                }, 1000);
              };
              
              // Eventos para detectar cancelamento
              window.addEventListener('beforeprint', function() {
                console.log('Preparando para imprimir...');
              });
              
              window.addEventListener('afterprint', function() {
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
    <div className="legacy-page">
      <style jsx global>{`
        /* Estilos específicos para navegadores antigos */

        /* Reset básico */
        * {
          box-sizing: border-box;
        }

        .legacy-page {
          min-height: 100vh;
          background: #10b981;
          font-family: Arial, Helvetica, sans-serif;
        }

        /* Header */
        .header {
          position: absolute;
          top: 0;
          right: 0;
          z-index: 50;
          padding: 16px 24px;
        }

        /* Main section com gradiente compatível */
        .main-section {
          background: #4f46e5; /* Fallback */
          background: -webkit-linear-gradient(
            left,
            #4f46e5,
            #10b981
          ); /* Safari 5.1-6 */
          background: -o-linear-gradient(
            left,
            #4f46e5,
            #10b981
          ); /* Opera 11.1-12 */
          background: -moz-linear-gradient(
            left,
            #4f46e5,
            #10b981
          ); /* Firefox 3.6-15 */
          background: linear-gradient(to right, #4f46e5, #10b981); /* Moderno */
          padding: 48px 16px;
        }

        .container {
          max-width: 64rem;
          margin: 0 auto;
          padding-left: 16px;
          padding-right: 16px;
        }

        .header-content {
          margin-bottom: 32px;
          text-align: center;
          padding-top: 40px;
        }

        .logo-wrapper {
          margin-bottom: 16px;
          text-align: center;
        }

        .logo-box {
          display: inline-block;
          height: 128px;
          width: 192px;
          text-align: center;
          vertical-align: middle;
          line-height: 128px;
        }

        .main-title {
          margin-bottom: 8px;
          font-size: 1.875rem;
          font-weight: bold;
          color: white;
        }

        .main-subtitle {
          color: rgba(255, 255, 255, 0.9);
        }

        /* Form styles */
        .form-section {
          margin-top: 32px;
        }

        .form-content {
          padding: 24px;
          background: white;
          border-radius: 8px;
          -webkit-box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          -moz-box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .form-space {
          display: block;
        }

        .form-space > * {
          margin-bottom: 24px;
        }

        .input-group {
          display: block;
        }

        .input-label {
          margin-bottom: 4px;
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .input-wrapper {
          position: relative;
        }

        .input-field {
          width: 100%;
          padding: 8px 40px 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          -webkit-box-sizing: border-box;
          -moz-box-sizing: border-box;
          box-sizing: border-box;
        }

        .input-field:focus {
          outline: none;
          border-color: #4f46e5;
          -webkit-box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          -moz-box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .input-field.error {
          border-color: #ef4444;
        }

        .input-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          margin-top: -8px;
          color: #9ca3af;
        }

        .error-message {
          margin-top: 4px;
          font-size: 0.875rem;
          color: #ef4444;
        }

        .checkbox-group {
          display: block;
        }

        .checkbox-input {
          height: 16px;
          width: 16px;
          border-radius: 4px;
          border: 1px solid #d1d5db;
          color: #4f46e5;
          vertical-align: middle;
          margin-right: 8px;
        }

        .checkbox-label {
          display: inline;
          font-size: 0.875rem;
          color: #374151;
          vertical-align: middle;
        }

        .submit-button {
          width: 100%;
          background: #4f46e5;
          color: white;
          padding: 12px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          text-align: center;
          font-size: 16px;
          -webkit-transition: background 0.3s;
          -moz-transition: background 0.3s;
          -o-transition: background 0.3s;
          transition: background 0.3s;
        }

        .submit-button:hover {
          background: #4338ca;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Results */
        .results-section {
          margin-top: 32px;
        }

        .results-title {
          margin-bottom: 16px;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        /* Grid com fallback para float */
        .convenios-grid {
          width: 100%;
        }

        .convenios-grid::after {
          content: "";
          display: table;
          clear: both;
        }

        @media (min-width: 1024px) {
          .convenios-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 32px;
          }

          .convenios-grid .convenio-card {
            float: none;
            width: 102.72mm;
            margin-right: 0;
          }
        }

        @media (max-width: 1023px) {
          .convenios-grid {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
        }

        .convenio-card {
          width: 102.72mm; /* Largura de cartão de crédito + 20% */
          height: 64.78mm; /* Altura de cartão de crédito + 20% */
          margin: 0 auto 32px auto;
          background: white;
          background-image: url("/logo01.svg");
          background-repeat: no-repeat;
          background-position: center;
          background-size: 60% auto;
          background-blend-mode: overlay;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 16px;
          -webkit-box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          -moz-box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .convenio-header {
          margin-bottom: 8px;
          position: relative;
          z-index: 2;
        }

        .convenio-name {
          font-size: 0.775rem; /* Reduzido para caber no cartão */
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }

        .convenio-info {
          font-size: 0.75rem; /* Reduzido para caber no cartão */
          color: #6b7280;
          margin-bottom: 2px;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }

        .convenio-info strong {
          font-weight: 500;
        }

        /* Status badges */
        .status-ativo {
          background: #dcfce7;
          color: #166534;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.625rem; /* Menor para caber no cartão */
          font-weight: 500;
          display: inline-block;
          margin: 4px 0;
          text-shadow: none;
          position: relative;
          z-index: 2;
        }

        .status-vencido {
          background: #fecaca;
          color: #991b1b;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.625rem; /* Menor para caber no cartão */
          font-weight: 500;
          display: inline-block;
          margin: 4px 0;
          text-shadow: none;
          position: relative;
          z-index: 2;
        }

        .status-indefinido {
          background: #f3f4f6;
          color: #1f2937;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.625rem; /* Menor para caber no cartão */
          font-weight: 500;
          display: inline-block;
          margin: 4px 0;
          text-shadow: none;
          position: relative;
          z-index: 2;
        }

        .dependentes-section {
          margin-top: 0px;
          position: relative;
          z-index: 2;
        }

        .dependentes-title {
          font-size: 0.75rem; /* Menor para caber no cartão */
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }

        .dependente-item {
          font-size: 0.625rem; /* Menor para caber no cartão */
          color: #6b7280;
          margin-bottom: 2px;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }

        .dependente-bullet {
          margin-right: 4px;
        }

        /* Loading */
        .loading-section {
          padding: 32px 0;
          text-align: center;
        }

        .loading-spinner {
          margin: 0 auto 16px;
          height: 48px;
          width: 48px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #4f46e5;
          border-radius: 50%;
          -webkit-animation: spin 1s linear infinite;
          -moz-animation: spin 1s linear infinite;
          animation: spin 1s linear infinite;
        }

        @-webkit-keyframes spin {
          0% {
            -webkit-transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
          }
        }

        @-moz-keyframes spin {
          0% {
            -moz-transform: rotate(0deg);
          }
          100% {
            -moz-transform: rotate(360deg);
          }
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .loading-text {
          color: #6b7280;
        }

        /* No results */
        .no-results {
          padding: 32px 0;
          text-align: center;
        }

        .no-results-icon {
          margin: 0 auto 16px;
          height: 64px;
          width: 64px;
          color: #9ca3af;
        }

        .no-results-title {
          margin-bottom: 4px;
          font-size: 1.125rem;
          font-weight: 500;
          color: #374151;
        }

        .no-results-text {
          color: #6b7280;
        }

        /* How it works */
        .how-it-works {
          max-width: 64rem;
          margin: 0 auto;
          padding: 48px 16px;
          background: #eff6ff; /* Fallback - blue-50 */
          background: -webkit-linear-gradient(
            to bottom right,
            #eff6ff,
            #e0e7ff,
            #e9d5ff
          ); /* Safari 5.1-6 */
          background: -o-linear-gradient(
            to bottom right,
            #eff6ff,
            #e0e7ff,
            #e9d5ff
          ); /* Opera 11.1-12 */
          background: -moz-linear-gradient(
            to bottom right,
            #eff6ff,
            #e0e7ff,
            #e9d5ff
          ); /* Firefox 3.6-15 */
          background: linear-gradient(
            to bottom right,
            #eff6ff,
            #e0e7ff,
            #e9d5ff
          ); /* Moderno */
        }

        .how-it-works-header {
          margin-bottom: 32px;
          text-align: center;
        }

        .how-it-works-title {
          margin-bottom: 8px;
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
        }

        .how-it-works-subtitle {
          max-width: 32rem;
          margin: 0 auto;
          color: #6b7280;
        }

        .features-grid {
          width: 100%;
        }

        .features-grid::after {
          content: "";
          display: table;
          clear: both;
        }

        @media (min-width: 768px) {
          .features-grid .feature-card {
            float: left;
            width: 31.33%;
            margin-right: 3%;
          }

          .features-grid .feature-card:nth-child(3n) {
            margin-right: 0;
          }
        }

        .feature-card {
          border-radius: 8px;
          background: white;
          padding: 24px;
          margin-bottom: 32px;
          -webkit-box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          -moz-box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          -webkit-transition: box-shadow 0.3s;
          -moz-transition: box-shadow 0.3s;
          -o-transition: box-shadow 0.3s;
          transition: box-shadow 0.3s;
        }

        .feature-card:hover {
          -webkit-box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          -moz-box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          margin-bottom: 16px;
          font-size: 1.5rem;
          color: #4f46e5;
        }

        .feature-title {
          margin-bottom: 8px;
          font-weight: 600;
          color: #1f2937;
        }

        .feature-description {
          color: #6b7280;
        }

        /* Footer */
        .footer {
          background: #1f2937;
          padding: 32px 0;
          color: white;
        }

        .footer-container {
          max-width: 64rem;
          margin: 0 auto;
          padding: 0 16px;
        }

        .footer-content {
          text-align: center;
        }

        .social-links {
          margin-bottom: 16px;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
        }

        .social-links a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .social-link {
          -webkit-transition: color 0.3s;
          -moz-transition: color 0.3s;
          -o-transition: color 0.3s;
          transition: color 0.3s;
          color: white;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .social-link:hover {
          color: #a78bfa;
        }

        .footer-divider {
          margin-top: 24px;
          border-top: 1px solid #374151;
          padding-top: 24px;
          text-align: center;
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .footer-links {
          margin-top: 8px;
        }

        .footer-link {
          -webkit-transition: color 0.3s;
          -moz-transition: color 0.3s;
          -o-transition: color 0.3s;
          transition: color 0.3s;
          color: #9ca3af;
          text-decoration: none;
        }

        .footer-link:hover {
          color: #a78bfa;
        }

        /* Dialog PDF */
        .dialog-pdf {
          max-width: 28rem !important; /* 448px - equivalente a sm:max-w-md */
          width: 100% !important;
          border: none !important;
          border-radius: 8px !important;
          box-shadow:
            0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }

        @media (max-width: 640px) {
          .dialog-pdf {
            max-width: calc(100% - 2rem) !important;
            margin: 0 1rem !important;
          }
        }

        /* Botão Emerald */
        .btn-emerald {
          background-color: #059669 !important; /* bg-emerald-600 */
          color: white !important;
          border: none !important;
          -webkit-transition: background-color 0.3s !important;
          -moz-transition: background-color 0.3s !important;
          -o-transition: background-color 0.3s !important;
          transition: background-color 0.3s !important;
        }

        .btn-emerald:hover {
          background-color: #047857 !important; /* bg-emerald-700 */
        }

        .btn-emerald:disabled {
          background-color: #6b7280 !important; /* bg-gray-500 */
          cursor: not-allowed !important;
        }

        /* Menu Dropdown */
        .w-44.bg-white {
          border: none !important;
          border-radius: 6px !important;
          box-shadow:
            0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }

        /* Hover nos itens do menu */
        [data-slot="dropdown-menu-item"] {
          -webkit-transition:
            background-color 0.2s,
            color 0.2s !important;
          -moz-transition:
            background-color 0.2s,
            color 0.2s !important;
          -o-transition:
            background-color 0.2s,
            color 0.2s !important;
          transition:
            background-color 0.2s,
            color 0.2s !important;
          cursor: pointer !important;
          border-radius: 4px !important;
        }

        [data-slot="dropdown-menu-item"]:hover {
          background-color: #f3f4f6 !important; /* bg-gray-100 */
          color: #1f2937 !important; /* text-gray-800 */
        }

        [data-slot="dropdown-menu-item"]:active {
          background-color: #e5e7eb !important; /* bg-gray-200 */
        }
      `}</style>

      {/* Header com menu */}
      <header className="header">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-emerald-600/90 text-white backdrop-blur-sm hover:bg-emerald-700/90"
            >
              <Menu className="mr-2 h-4 w-4" />
              Menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 bg-white"
            sideOffset={8}
            avoidCollisions={true}
            collisionPadding={16}
          >
            <DropdownMenuItem asChild>
              <Link href="/convenio" className="flex w-full items-center">
                <IdCard className="mr-2 h-4 w-4" />
                Seja Conveniado
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={abrirDialogoCartao}>
              <CreditCard className="mr-2 h-4 w-4" />
              Meu Cartão
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/authentication" className="flex w-full items-center">
                <Search className="mr-2 h-4 w-4" />
                Entrar no Sistema
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Seção principal */}
      <div className="main-section">
        <div className="container">
          <div className="header-content">
            <div className="logo-wrapper">
              <div className="logo-box">
                <Image
                  src="/logo03.svg"
                  alt="Mais Saúde Lasac Logo"
                  width={200}
                  height={150}
                  className="h-full w-full rounded-lg object-contain"
                />
              </div>
            </div>
            <h1 className="main-title">Consulta de Benefícios</h1>
            <p className="main-subtitle">
              Verifique seus convênios e benefícios utilizando CPF, nome do
              titular ou nome de dependente
            </p>
          </div>

          <div className="form-section">
            <Card className="border-0 shadow-xl">
              <CardContent className="form-content">
                <form onSubmit={handleSubmit} className="form-space">
                  <div className="input-group">
                    <Label htmlFor="cpf" className="input-label pb-2">
                      CPF, Nome do Titular ou Dependente
                    </Label>
                    <div className="input-wrapper">
                      <Input
                        type="text"
                        id="cpf"
                        name="cpf"
                        placeholder="123.456.789-09 ou Maria Silva"
                        value={cpf}
                        onChange={handleCpfChange}
                        className={`input-field ${errors.cpf ? "error" : ""}`}
                        maxLength={60}
                      />
                      <div className="input-icon">
                        <IdCard className="h-4 w-4" />
                      </div>
                    </div>
                    {errors.cpf && (
                      <p className="error-message">{errors.cpf}</p>
                    )}
                  </div>

                  <div className="input-group">
                    <div className="checkbox-group">
                      <input
                        id="consentimento"
                        name="consentimento"
                        type="checkbox"
                        checked={consentimento}
                        onChange={(e) =>
                          handleConsentimentoChange(e.target.checked)
                        }
                        className="checkbox-input"
                      />
                      <label htmlFor="consentimento" className="checkbox-label">
                        Concordo com os termos de uso e política de privacidade
                      </label>
                    </div>
                    {errors.consentimento && (
                      <p className="error-message">{errors.consentimento}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="submit-button"
                  >
                    <Search className="h-4 w-4" />
                    {loading ? "Consultando..." : "Consultar Benefícios"}
                  </Button>
                </form>

                {/* Resultados */}
                {convenios.length > 0 && (
                  <div className="results-section">
                    <h2 className="results-title">Convênios encontrados</h2>
                    <div className="convenios-grid">
                      {convenios.map((conv, i) => (
                        <div key={i} className="convenio-card">
                          <div className="convenio-header">
                            <h3 className="convenio-name">{conv.nome}</h3>

                            <div className="convenio-info">
                              {conv.tipo === "Empresa" && conv.empresa ? (
                                <p>
                                  <strong>Tipo:</strong> {conv.tipo}:{" "}
                                  {conv.empresa}
                                </p>
                              ) : (
                                <p>
                                  <strong>Tipo:</strong> {conv.tipo}
                                </p>
                              )}
                            </div>

                            <div
                              className={getStatusClassName(
                                conv.validadeOriginal,
                              )}
                            >
                              Status: {getStatusConvenio(conv.validadeOriginal)}
                              <br />
                              Vencimento: {conv.validade}
                            </div>
                          </div>

                          {conv.dependentes && conv.dependentes.length > 0 && (
                            <div className="dependentes-section">
                              <p className="dependentes-title">Dependentes:</p>
                              <div>
                                {conv.dependentes.map((dependente, idx) => (
                                  <div key={idx} className="dependente-item">
                                    <span className="dependente-bullet">•</span>
                                    <span>{dependente}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="loading-section">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Buscando informações...</p>
                  </div>
                )}

                {/* Sem resultados */}
                {semResultados && !loading && (
                  <div className="no-results">
                    <div className="no-results-icon">
                      <Search className="h-16 w-16" />
                    </div>
                    <h3 className="no-results-title">
                      Nenhum convênio encontrado
                    </h3>
                    <p className="no-results-text">
                      Não encontramos benefícios associados a este CPF ou nome.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Seção "Como funciona" */}
      <div className="how-it-works">
        <div className="how-it-works-header">
          <h2 className="how-it-works-title">Como funciona?</h2>
          <p className="how-it-works-subtitle">
            Nosso sistema opera em parceria com diversas instituições para
            garantir a melhor experiência para nossos clientes.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <IdCard className="h-8 w-8" />
            </div>
            <h3 className="feature-title">Consulta Dinâmica</h3>
            <p className="feature-description">
              Digite seu CPF, seu nome completo ou o nome de um dependente.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="feature-title">Consulta integrada</h3>
            <p className="feature-description">
              Nossa plataforma buscará em todas as instituições conveniadas.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="feature-title">Resultados completos</h3>
            <p className="feature-description">
              Veja todos seus benefícios com detalhes de cobertura e validade.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="social-links">
              <a
                href="https://www.facebook.com/profile.php?id=100093100000000"
                className="social-link"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/laboratoriolasac/"
                className="social-link"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/laboratorio-lasac/"
                className="social-link"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="footer-divider">
            <p>
              © 2025 Laboratório Lasac. Todos os direitos reservados. Powered
              by{" "}
              <a
                href="https://www.sertaosoftware.com.br"
                className="footer-link"
              >
                Sertao Software
              </a>
            </p>
            <p className="footer-links">
              <a href="https://www.google.com" className="footer-link">
                Termos de uso
              </a>{" "}
              |{" "}
              <a href="https://www.google.com" className="footer-link">
                Política de privacidade
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Diálogo para gerar cartão PDF */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="dialog-pdf bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gerar Cartão em PDF
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cpf-cartao" className="pb-2 text-sm font-medium">
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
                  className="mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="consentimento-cartao" className="pt-2 text-sm">
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
                className="btn-emerald flex-1"
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

export default HomeLegacy;

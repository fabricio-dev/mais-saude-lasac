"use client";

import { motion } from "framer-motion";
import {
  Facebook,
  FileText,
  IdCard,
  Instagram,
  Linkedin,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

        // Se contém letras (nome), deve ter pelo menos 2 caracteres
        return trimmed.length >= 2;
      },
      {
        message:
          "Digite um CPF válido (11 dígitos) ou um nome com pelo menos 2 caracteres",
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
  const [errors, setErrors] = useState<
    Partial<Record<keyof ConsultaConvenioForm, string>>
  >({});

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
              tipo: `${paciente.cardType === "enterprise" ? "Empresarial" : "Individual"} - ${paciente.numberCards} cartão(s)`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-200">
      {/* Header com botão Entrar */}
      <header className="absolute top-0 right-0 p-6">
        <Link href="/authentication">
          <Button
            variant="outline"
            className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
          >
            Entrar
          </Button>
        </Link>
      </header>

      {/* Seção principal */}
      <div className="bg-gradient-to-r from-indigo-600 to-emerald-500 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 flex justify-center">
              {/* Logo placeholder - você pode substituir por sua imagem */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-600">
                <Search className="h-6 w-6" />
              </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">
              Consulta de Benefícios
            </h1>
            <p className="text-white/90">
              Verifique seus convênios e benefícios utilizando seu CPF ou nome
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
                      CPF ou Nome
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        id="cpf"
                        name="cpf"
                        placeholder="123.456.789-09 ou João Silva"
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
                    <div className="space-y-4">
                      {convenios.map((conv, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-5 transition hover:bg-gray-100"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="flex-shrink-0">
                              <div className="flex h-15 w-15 items-center justify-center rounded-lg bg-indigo-100">
                                <FileText className="h-8 w-8 text-indigo-600" />
                              </div>
                            </div>
                            <div className="flex-grow">
                              <h3 className="text-lg font-semibold text-gray-800">
                                {conv.nome}
                              </h3>
                              <p className="mb-2 text-sm text-gray-600">
                                Tipo: {conv.tipo}
                              </p>
                              <p className="mb-1 text-sm text-gray-600">
                                {conv.tipo === "Empresarial"
                                  ? "Empresa: " + conv.empresa
                                  : ""}
                              </p>

                              {conv.dependentes &&
                                conv.dependentes.length > 0 && (
                                  <div className="mb-3">
                                    <p className="mb-2 text-sm font-medium text-gray-700">
                                      Dependentes:
                                    </p>
                                    <div className="space-y-1">
                                      {conv.dependentes.map(
                                        (dependente, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center text-sm text-gray-600"
                                          >
                                            <span className="mr-2">•</span>
                                            <span>{dependente}</span>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                              <div className="flex flex-wrap gap-2 text-sm">
                                <span
                                  className={`rounded px-2 py-1 ${getStatusClassName(conv.validadeOriginal)}`}
                                >
                                  Status:{" "}
                                  {getStatusConvenio(conv.validadeOriginal)}
                                </span>
                                <span className="rounded bg-blue-100 px-2 py-1 text-blue-800">
                                  Vencimento: {conv.validade}
                                </span>
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
                      Não encontramos benefícios associados a este CPF.
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
              Informe seu CPF ou Nome
            </h3>
            <p className="text-gray-600">
              Digite seu CPF no formato correto ou seu nome completo para
              realizar a consulta.
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
    </div>
  );
}

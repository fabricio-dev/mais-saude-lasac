"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { createPatient } from "@/actions/create-patient";
import { createPatientSchema } from "@/actions/create-patient/schema";
import ContratoDialog from "@/app/contrato/_components/contrato-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WhatsappConsentField } from "@/components/whatsapp-consent-field";

import { PaymentInfoDialog } from "./payment-info-dialog";

// Função para verificar CPF duplicado
const checkCPFExists = async (cpf: string): Promise<boolean> => {
  try {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) return false;

    const response = await fetch("/api/check-cpf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cpf: cleanCPF }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.exists;
    }
    return false;
  } catch {
    return false;
  }
};

// Função para validar CPF
const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, "");

  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(cleanCPF.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;

  return digit2 === parseInt(cleanCPF.charAt(10));
};

// Interface para clínicas
interface Clinic {
  id: string;
  name: string;
}

const ufs = [
  "PE",
  "CE",
  "BA",
  "PB",
  "PI",
  "RN",
  "SE",
  "TO",
  "MA",
  "AC",
  "AL",
  "AP",
  "AM",
  "DF",
  "ES",
  "GO",
  "MT",
  "MS",
  "MG",
  "PA",
  "PR",
  "RJ",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
];

export function ConvenioForm() {
  const searchParams = useSearchParams();
  const [checkingCPF, setCheckingCPF] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // ID padrão da URL
  const defaultClinicId = searchParams.get("clinicId") || "";

  const form = useForm<z.infer<typeof createPatientSchema>>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      name: "",
      birthDate: "2007-09-01",
      phoneNumber: "",
      rgNumber: "",
      cpfNumber: "",
      address: "",
      homeNumber: "",
      city: "",
      state: "",
      cardType: "personal",
      Enterprise: "",
      numberCards: "1",
      clinicId: defaultClinicId,
      sellerId: "",
      observation: "",
      dependents1: "",
      dependents2: "",
      dependents3: "",
      dependents4: "",
      dependents5: "",
      dependents6: "",
      acceptTerms: false,
    },
  });

  const createPatientAction = useAction(createPatient, {
    onSuccess: () => {
      console.log("Sucesso! Mostrando dialog...");
      setShowPaymentDialog(true);
      toast.success("Solicitação de convênio enviada com sucesso!");
      // Reset do form após um pequeno delay para evitar conflitos
      setTimeout(() => {
        form.reset();
      }, 100);
    },
    onError: (error) => {
      console.log("Erro:", error);
      toast.error(error.error.serverError || "Erro ao enviar solicitação");
    },
  });

  const onSubmit = (values: z.infer<typeof createPatientSchema>) => {
    createPatientAction.execute(values);
  };

  // Carregar clínicas do usuário admin
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoadingClinics(true);
        const response = await fetch("/api/admin/clinics");
        if (response.ok) {
          const data = await response.json();
          setClinics(data);

          // Se há um clinicId padrão da URL, definir no formulário
          if (
            defaultClinicId &&
            data.some((clinic: Clinic) => clinic.id === defaultClinicId)
          ) {
            form.setValue("clinicId", defaultClinicId);
          }
        } else {
          toast.error("Erro ao carregar clínicas");
        }
      } catch (error) {
        console.error("Erro ao carregar clínicas:", error);
        toast.error("Erro ao carregar clínicas");
      } finally {
        setLoadingClinics(false);
      }
    };

    fetchClinics();
  }, [defaultClinicId, form]);

  // Buscar vendedor "cadastro-externo" quando a clínica for selecionada
  const selectedClinicId = form.watch("clinicId");

  useEffect(() => {
    const fetchExternalSeller = async (clinicId: string) => {
      if (!clinicId) {
        form.setValue("sellerId", "");
        return;
      }

      try {
        const response = await fetch(
          `/api/public/sellers?clinicId=${clinicId}`,
        );
        if (response.ok) {
          const data = await response.json();

          // A API já filtra por vendedores "cadastro-externo", pegar o primeiro
          if (data.length > 0) {
            form.setValue("sellerId", data[0].id);
          } else {
            form.setValue("sellerId", "");
            toast.error(
              "Ainda não é possível realizar o cadastro externo nesta unidade. Por favor, entre em contato com o suporte.",
            );
          }
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Erro ao carregar vendedores");
        }
      } catch (error) {
        console.error("Erro ao carregar vendedores:", error);
        toast.error("Erro ao carregar vendedores");
      }
    };

    fetchExternalSeller(selectedClinicId);
  }, [selectedClinicId, form]);

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Seja um Conveniado
        </h1>
        <p className="text-white">
          Preencha seus dados para solicitar seu convênio. Nossa equipe entrará
          em contato para finalizar o processo.
        </p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-emerald-950">
            Formulário de Solicitação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados Pessoais */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-emerald-900">
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Nome Titular
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o nome completo"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Data de Nascimento
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Telefone
                        </FormLabel>
                        <FormControl>
                          <PatternFormat
                            format="(##) #####-####"
                            mask="_"
                            placeholder="(11) 99999-9999"
                            customInput={Input}
                            value={field.value}
                            onValueChange={(values) => {
                              field.onChange(values.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rgNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">RG</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite apenas números"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpfNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          CPF{" "}
                          {checkingCPF && (
                            <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />
                          )}
                        </FormLabel>
                        <FormControl>
                          <PatternFormat
                            format="###.###.###-##"
                            mask="_"
                            placeholder="000.000.000-00"
                            customInput={Input}
                            value={field.value}
                            onValueChange={(values) => {
                              field.onChange(values.value);
                            }}
                            onBlur={async () => {
                              const cpf = field.value;
                              if (cpf && cpf.length >= 11 && isValidCPF(cpf)) {
                                setCheckingCPF(true);
                                try {
                                  const exists = await checkCPFExists(cpf);
                                  if (exists) {
                                    form.setError("cpfNumber", {
                                      type: "manual",
                                      message:
                                        "Este CPF já está cadastrado no sistema",
                                    });
                                  } else {
                                    form.clearErrors("cpfNumber");
                                  }
                                } finally {
                                  setCheckingCPF(false);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-emerald-900">
                  Endereço
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Endereço
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Rua, Avenida, número"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="homeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Bairro
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o nome do bairro"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Cidade
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o nome da cidade"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">UF</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a UF" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ufs.map((uf) => (
                              <SelectItem key={uf} value={uf}>
                                {uf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Informações do Convênio */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-emerald-900">
                  Informações do Convênio
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="clinicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Unidade{" "}
                          {loadingClinics && (
                            <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />
                          )}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingClinics}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a unidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clinics.map((clinic) => (
                              <SelectItem key={clinic.id} value={clinic.id}>
                                {clinic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cardType"
                    render={({ field }) => (
                      <FormItem hidden={true}>
                        <FormLabel className="text-emerald-950">
                          Tipo de Cartão
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de cartão" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="enterprise">EMPRESA</SelectItem>
                            <SelectItem value="personal">INDIVIDUAL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="Enterprise"
                    render={({ field }) => (
                      <FormItem hidden={true}>
                        <FormLabel className="text-emerald-950">
                          Empresa
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome da empresa"
                            disabled={form.watch("cardType") !== "enterprise"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberCards"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Quantidade de Cartões
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="6"
                            placeholder="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dependentes */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-emerald-900">
                  Dependentes (Opcional)
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dependents1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Dependente 1
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do dependente (opcional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dependents2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Dependente 2
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do dependente (opcional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dependents3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Dependente 3
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do dependente (opcional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dependents4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Dependente 4
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do dependente (opcional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dependents5"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Dependente 5
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do dependente (opcional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dependents6"
                    render={({ field }) => (
                      <FormItem hidden={true}>
                        <FormLabel className="text-emerald-950">
                          Dependente 6
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do dependente (opcional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="observation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-emerald-950">
                          Observações
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Observações adicionais (opcional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Termos e Condições */}

              <div>
                <h3 className="mb-4 text-lg font-semibold text-emerald-900">
                  Termos e Condições
                </h3>

                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="mb-3 text-sm text-emerald-800">
                      Para prosseguir com sua solicitação de convênio, é
                      necessário aceitar nossos termos de uso e política de
                      privacidade.
                    </p>
                    <div className="mb-3">
                      <ContratoDialog
                        trigger={
                          <button className="inline-flex items-center text-sm font-medium text-emerald-700 underline hover:text-emerald-900">
                            📋 Visualizar Contrato e Termos de Uso
                            <svg
                              className="ml-1 h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </button>
                        }
                      />
                    </div>
                    <WhatsappConsentField
                      control={form.control}
                      name="whatsappConsent"
                      label="Você autoriza o recebimento de avisos, lembretes e comunicações sobre o seu cartão LASAC por WhatsApp?"
                      tone="emerald"
                      className="mb-4"
                    />
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium text-emerald-950">
                              Li e aceito os termos de uso e política de
                              privacidade
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Envio */}
              <div className="flex flex-col space-y-3 pt-6 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
                <Button
                  type="submit"
                  disabled={createPatientAction.isExecuting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 sm:max-w-md"
                  size="lg"
                >
                  {createPatientAction.isExecuting
                    ? "Enviando..."
                    : "Solicitar Convênio"}
                </Button>

                <Button
                  type="button"
                  onClick={() => setShowPaymentDialog(true)}
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  💳 Informações de Pagamento
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dialog de Informações de Pagamento */}
      <PaymentInfoDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
      />
    </div>
  );
}

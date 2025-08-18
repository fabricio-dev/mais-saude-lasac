"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, CreditCard, Loader2, Phone } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { createPatient } from "@/actions/create-patient";
import { createPatientSchema } from "@/actions/create-patient/schema";
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
import { PageContainer } from "@/components/ui/page-container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface VendedorInfo {
  id: string;
  name: string;
  clinicId: string;
  clinicName: string;
  phoneNumber: string;
  pixKey: string;
  pixKeyType: string;
}

export default function ConvenioVendedorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [checkingCPF, setCheckingCPF] = useState(false);
  const [vendedorInfo, setVendedorInfo] = useState<VendedorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const vendedorId = params.vendedorId as string;
  const clinicId =
    searchParams.get("clinicId") || "e95a2da4-96c0-4277-b4c3-bcf8f2c5414a";

  // Buscar informações do vendedor
  useEffect(() => {
    const fetchVendedorInfo = async () => {
      try {
        const response = await fetch(`/api/sellers/${vendedorId}`);
        if (response.ok) {
          const data = await response.json();
          setVendedorInfo(data);
        } else {
          toast.error("Vendedor não encontrado");
          router.push("/convenio");
        }
      } catch (error) {
        console.error("Erro ao buscar vendedor:", error);
        toast.error("Erro ao carregar informações do vendedor");
        router.push("/convenio");
      } finally {
        setLoading(false);
      }
    };

    if (vendedorId) {
      fetchVendedorInfo();
    }
  }, [vendedorId, router]);

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
      clinicId: vendedorInfo?.clinicId || clinicId,
      sellerId: vendedorId,
      observation: "",
      dependents1: "",
      dependents2: "",
      dependents3: "",
      dependents4: "",
      dependents5: "",
      dependents6: "",
    },
  });

  // Atualizar os IDs quando as informações do vendedor carregarem
  useEffect(() => {
    if (vendedorInfo) {
      form.setValue("clinicId", vendedorInfo.clinicId);
      form.setValue("sellerId", vendedorInfo.id);
    }
  }, [vendedorInfo, form]);

  const createPatientAction = useAction(createPatient, {
    onSuccess: () => {
      toast.success(
        `Solicitação de convênio enviada com sucesso! ${vendedorInfo?.name} entrará em contato em breve.`,
      );
      form.reset();
      // Redirecionar para página inicial após 3 segundos
      setTimeout(() => {
        router.push("/");
      }, 3000);
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao enviar solicitação");
    },
  });

  const onSubmit = (values: z.infer<typeof createPatientSchema>) => {
    createPatientAction.execute({
      ...values,
      clinicId: vendedorInfo?.clinicId || clinicId,
      sellerId: vendedorId,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-green-100 to-teal-200">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-2 text-emerald-700">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-100 to-teal-200">
      {/* Header */}
      <header className="bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo03.svg"
                  alt="Mais Saúde Lasac Logo"
                  width={40}
                  height={30}
                  className="h-8 w-auto object-contain"
                />
                <h1 className="text-xl font-bold text-emerald-900">
                  Mais Saúde Lasac
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <PageContainer>
        <div className="mx-auto max-w-4xl py-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-emerald-900">
              Seja um Conveniado
            </h1>
            {vendedorInfo && (
              <div className="mb-4 rounded-lg bg-emerald-100 p-4">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <p className="text-emerald-800">
                    <span className="font-semibold">Vendedor:</span>{" "}
                    {vendedorInfo.name}
                  </p>
                  <p className="text-emerald-700">
                    <span className="font-semibold">Unidade:</span>{" "}
                    {vendedorInfo.clinicName}
                  </p>
                  <p className="flex items-center text-emerald-700">
                    <Phone className="mr-2 h-4 w-4" />
                    <span className="font-semibold">WhatsApp:</span>{" "}
                    <a
                      href={`https://wa.me/55${vendedorInfo.phoneNumber.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 hover:underline"
                    >
                      {vendedorInfo.phoneNumber}
                    </a>
                  </p>
                  <div className="flex items-center text-emerald-700">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span className="font-semibold">
                      PIX ({vendedorInfo.pixKeyType}):
                    </span>{" "}
                    <span className="ml-1 font-mono text-sm">
                      {vendedorInfo.pixKey}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            vendedorInfo.pixKey,
                          );
                          toast.success("Chave PIX copiada!");
                        } catch {
                          toast.error("Erro ao copiar chave PIX");
                        }
                      }}
                      className="ml-2 rounded p-1 hover:bg-emerald-200"
                      title="Copiar chave PIX"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <p className="text-emerald-700">
              Preencha seus dados para solicitar seu convênio. Ao finalizar seu
              cadastro, faca o pagamento atraves do PIX e aguarde e envie o
              comprovante para o vendedor, no numero do whatsapp.
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
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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
                            <FormLabel className="text-emerald-950">
                              RG
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Digite apenas números"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    "",
                                  );
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
                                  if (
                                    cpf &&
                                    cpf.length >= 11 &&
                                    isValidCPF(cpf)
                                  ) {
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
                            <FormLabel className="text-emerald-950">
                              UF
                            </FormLabel>
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
                        name="cardType"
                        render={({ field }) => (
                          <FormItem>
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
                                <SelectItem value="enterprise">
                                  EMPRESA
                                </SelectItem>
                                <SelectItem value="personal">
                                  INDIVIDUAL
                                </SelectItem>
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
                          <FormItem>
                            <FormLabel className="text-emerald-950">
                              Empresa
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nome da empresa"
                                disabled={
                                  form.watch("cardType") !== "enterprise"
                                }
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
                                min="1"
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
                          <FormItem>
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
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
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

                  {/* Botão de Envio */}
                  <div className="flex justify-center pt-6">
                    <Button
                      type="submit"
                      disabled={createPatientAction.isExecuting}
                      className="w-full max-w-md bg-emerald-600 hover:bg-emerald-700"
                      size="lg"
                    >
                      {createPatientAction.isExecuting
                        ? "Enviando..."
                        : "Solicitar Convênio"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertPatient } from "@/actions/upsert-patient";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patientsTable } from "@/db/schema";

// Função para verificar CPF duplicado
const checkCPFExists = async (
  cpf: string,
  patientId?: string,
): Promise<boolean> => {
  try {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) return false;

    const response = await fetch("/api/check-cpf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cpf: cleanCPF, patientId }),
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

const formSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Nome titular é obrigatório" }),
    birthDate: z
      .string()
      .min(1, { message: "Data de nascimento é obrigatória" }),
    phoneNumber: z
      .string()
      .trim()
      .min(10, { message: "Telefone é obrigatório" }),
    rgNumber: z.string().trim().min(1, { message: "RG é obrigatório" }),
    cpfNumber: z
      .string()
      .trim()
      .min(11, { message: "CPF é obrigatório" })
      .refine((cpf) => isValidCPF(cpf), {
        message: "CPF inválido",
      }),
    address: z.string().trim().min(1, { message: "Endereço é obrigatório" }),
    homeNumber: z.string().trim().min(1, { message: "Bairro é obrigatório" }),
    city: z.string().trim().min(1, { message: "Cidade é obrigatória" }),
    state: z.string().trim().min(2, { message: "UF é obrigatória" }),

    cardType: z.enum(["enterprise", "personal"], {
      message: "Tipo de cartão é obrigatório",
    }),
    Enterprise: z.string().optional(),
    numberCards: z
      .string()
      .min(1, { message: "Quantidade de cartões é obrigatória" })
      .refine((value) => parseInt(value) > 0, {
        message: "A quantidade de cartões deve ser maior que 0",
      })
      .refine((value) => parseInt(value) <= 6, {
        message: "A quantidade de cartões não pode ser maior que 6",
      }),

    // TODO: Verificar se a quantidade de cartões é maior que o número de dependentes
    sellerId: z.string().uuid({ message: "Vendedor é obrigatório" }),
    clinicId: z.string().uuid({ message: "Clínica é obrigatória" }),
    observation: z.string().optional(),
    dependents1: z.string().optional(),
    dependents2: z.string().optional(),
    dependents3: z.string().optional(),
    dependents4: z.string().optional(),
    dependents5: z.string().optional(),
    dependents6: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.cardType === "enterprise" &&
      (!data.Enterprise || data.Enterprise.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nome da empresa é obrigatório para cartão empresarial",
        path: ["Enterprise"],
      });
    }
  });

interface UpsertPatientFormProps {
  isOpen: boolean;
  patient?: typeof patientsTable.$inferSelect;
  onSuccess?: () => void;
}

interface Seller {
  id: string;
  name: string;
  // mudei para o id para testar
}
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

const UpsertPatientForm = ({
  isOpen,
  patient,
  onSuccess,
}: UpsertPatientFormProps) => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [checkingCPF, setCheckingCPF] = useState(false);
  const [openSeller, setOpenSeller] = useState(false);
  const [openClinic, setOpenClinic] = useState(false);

  // Estados para loaders dos comboboxes
  const [loadingState, setLoadingState] = useState(false);
  const [loadingCardType, setLoadingCardType] = useState(false);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const [loadingClinic, setLoadingClinic] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patient?.name ?? "",
      birthDate: patient?.birthDate
        ? new Date(patient.birthDate).toISOString().split("T")[0]
        : "2007-09-01",
      phoneNumber: patient?.phoneNumber ?? "",
      rgNumber: patient?.rgNumber ?? "",
      cpfNumber: patient?.cpfNumber ?? "",
      address: patient?.address ?? "",
      homeNumber: patient?.homeNumber ?? "",
      city: patient?.city ?? "",
      state: patient?.state ?? "",

      cardType: patient?.cardType ?? "personal",
      Enterprise: patient?.Enterprise ?? "",
      numberCards: patient?.numberCards?.toString() ?? "",
      sellerId: patient?.sellerId ?? "",
      clinicId: patient?.clinicId ?? "", // mudei para o id para testar
      observation: patient?.observation ?? "",
      dependents1: patient?.dependents1 ?? "",
      dependents2: patient?.dependents2 ?? "",
      dependents3: patient?.dependents3 ?? "",
      dependents4: patient?.dependents4 ?? "",
      dependents5: patient?.dependents5 ?? "",
      dependents6: patient?.dependents6 ?? "",
    },
  });

  // Carregar clínicas e vendedores
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: patient?.name ?? "",
        birthDate: patient?.birthDate
          ? new Date(patient.birthDate).toISOString().split("T")[0]
          : "2007-09-01",
        phoneNumber: patient?.phoneNumber ?? "",
        rgNumber: patient?.rgNumber ?? "",
        cpfNumber: patient?.cpfNumber ?? "",
        address: patient?.address ?? "",
        homeNumber: patient?.homeNumber ?? "",
        city: patient?.city ?? "",
        state: patient?.state ?? "",

        cardType: patient?.cardType ?? "personal",
        Enterprise: patient?.Enterprise ?? "",
        numberCards: patient?.numberCards?.toString() ?? "",
        sellerId: patient?.sellerId ?? "",
        clinicId: patient?.clinicId ?? "",
        observation: patient?.observation ?? "",
        dependents1: patient?.dependents1 ?? "",
        dependents2: patient?.dependents2 ?? "",
        dependents3: patient?.dependents3 ?? "",
        dependents4: patient?.dependents4 ?? "",
        dependents5: patient?.dependents5 ?? "",
        dependents6: patient?.dependents6 ?? "",
      });
    }
    const loadData = async () => {
      try {
        // Carregar vendedores
        const sellersResponse = await fetch("/api/sellers");
        if (sellersResponse.ok) {
          const sellersData = await sellersResponse.json();
          setSellers(sellersData);
        }
        // Carregar clínicas
        const clinicsResponse = await fetch("/api/clinics");
        if (clinicsResponse.ok) {
          const clinicsData = await clinicsResponse.json();
          setClinics(clinicsData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadData();
  }, [isOpen, patient, form]);

  const upsertPatientAction = useAction(upsertPatient, {
    onSuccess: () => {
      toast.success(
        patient
          ? "Paciente atualizado com sucesso"
          : "Paciente adicionado com sucesso",
      );
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao adicionar paciente");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    upsertPatientAction.execute({
      ...values,
      numberCards: parseInt(values.numberCards),
      id: patient?.id,
      clinicId: values.clinicId, // mudei para o id para testar
      Enterprise: values.Enterprise,
      observation: values.observation,
    });
  };

  return (
    <DialogContent className="max-h-[88vh] max-w-4xl overflow-x-hidden overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-amber-950">
          {patient ? patient.name : "Adicionar Paciente"}
        </DialogTitle>
        <DialogDescription className="text-amber-800">
          {patient
            ? "Edite as informações do paciente"
            : "Adicione um novo paciente ao sistema."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-950">Nome Titular</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome completo" {...field} />
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
                  <FormLabel className="text-amber-950">
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
                  <FormLabel className="text-amber-950">Telefone</FormLabel>
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
                  <FormLabel className="text-amber-950">RG</FormLabel>
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
                  <FormLabel className="text-amber-950">
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
                            const exists = await checkCPFExists(
                              cpf,
                              patient?.id,
                            );
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

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-950">Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Avenida, número" {...field} />
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
                  <FormLabel className="text-amber-950">Bairro</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do bairro" {...field} />
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
                  <FormLabel className="text-amber-950">Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome da cidade" {...field} />
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
                  <FormLabel className="text-amber-950">
                    UF{" "}
                    {loadingState && (
                      <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />
                    )}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    onOpenChange={(open) => {
                      if (!open) {
                        setLoadingState(true);
                        setTimeout(() => {
                          setLoadingState(false);
                        }, 250);
                      }
                    }}
                    defaultValue={field.value}
                    disabled={loadingState}
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

            <FormField
              control={form.control}
              name="cardType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-950">
                    Tipo de Cartão{" "}
                    {loadingCardType && (
                      <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />
                    )}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    onOpenChange={(open) => {
                      if (!open) {
                        setLoadingCardType(true);
                        setTimeout(() => {
                          setLoadingCardType(false);
                        }, 250);
                      }
                    }}
                    defaultValue={field.value}
                    disabled={loadingCardType}
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
                <FormItem>
                  <FormLabel className="text-amber-950">Empresa</FormLabel>
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
                  <FormLabel className="text-amber-950">
                    Quantidade de Cartões
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clinicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-950">
                    Unidade
                    {loadingClinic && (
                      <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Popover
                      open={openClinic}
                      onOpenChange={(open) => {
                        setOpenClinic(open);
                        if (!open) {
                          setLoadingClinic(true);
                          setTimeout(() => {
                            setLoadingClinic(false);
                          }, 250);
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openClinic}
                          className="w-full justify-between"
                          disabled={loadingClinic}
                        >
                          {clinics.find((clinic) => clinic.id === field.value)
                            ?.name || "Selecione a clínica"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar clínica..." />
                          <CommandList>
                            <CommandEmpty>
                              Nenhuma clínica encontrada.
                            </CommandEmpty>
                            <CommandGroup>
                              {clinics.map((clinic) => (
                                <CommandItem
                                  key={clinic.id}
                                  value={clinic.name}
                                  onSelect={async () => {
                                    setLoadingClinic(true);
                                    field.onChange(clinic.id);
                                    setOpenClinic(false);

                                    // Simula processamento
                                    setTimeout(() => {
                                      setLoadingClinic(false);
                                    }, 500);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      field.value === clinic.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  {clinic.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-950">
                    Vendedor
                    {loadingSeller && (
                      <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />
                    )}
                  </FormLabel>
                  <FormControl>
                    <Popover
                      open={openSeller}
                      onOpenChange={(open) => {
                        setOpenSeller(open);
                        if (!open) {
                          setLoadingSeller(true);
                          setTimeout(() => {
                            setLoadingSeller(false);
                          }, 250);
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openSeller}
                          className="w-full justify-between"
                          disabled={loadingSeller}
                        >
                          {sellers.find((seller) => seller.id === field.value)
                            ?.name || "Selecione o vendedor"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar vendedor..." />
                          <CommandList>
                            <CommandEmpty>
                              Nenhum vendedor encontrado.
                            </CommandEmpty>
                            <CommandGroup>
                              {sellers.map((seller) => (
                                <CommandItem
                                  key={seller.id}
                                  value={seller.name}
                                  onSelect={async () => {
                                    setLoadingSeller(true);
                                    field.onChange(seller.id);
                                    setOpenSeller(false);

                                    // Simula processamento
                                    setTimeout(() => {
                                      setLoadingSeller(false);
                                    }, 500);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      field.value === seller.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  {seller.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="gap-1">
            <FormField
              control={form.control}
              name="dependents1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-950">Dependente 1</FormLabel>
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
                  <FormLabel className="mt-1 text-amber-950">
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
                  <FormLabel className="mt-1 text-amber-950">
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
                  <FormLabel className="mt-1 text-amber-950">
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
                  <FormLabel className="mt-1 text-amber-950">
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
                  <FormLabel className="mt-1 text-amber-950">
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
                  <FormLabel className="mt-1 text-amber-950">
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

          <DialogFooter>
            <Button
              type="submit"
              disabled={upsertPatientAction.isExecuting}
              className="mt-1 w-full bg-emerald-600 hover:bg-emerald-900"
            >
              {upsertPatientAction.isExecuting
                ? "Salvando..."
                : patient
                  ? "Atualizar"
                  : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertPatientForm;

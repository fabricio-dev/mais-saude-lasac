import { zodResolver } from "@hookform/resolvers/zod";
import { TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { deleteSeller } from "@/actions/delete-seller";
import { upsertSeller } from "@/actions/upsert-seller";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
  FormDescription,
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
import { sellersTable } from "@/db/schema";

const formSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z
    .string()
    .trim()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
  cpfNumber: z.string().trim().min(11, { message: "CPF inválido" }),
  phoneNumber: z.string().trim().min(11, { message: "Telefone é obrigatório" }),
  unity: z.string().trim().min(1, { message: "Clínica é obrigatória" }),
});

interface UpsertSellerFormProps {
  isOpen: boolean;
  seller?: typeof sellersTable.$inferSelect;
  onSuccess?: () => void;
}

interface Clinic {
  id: string;
  name: string;
}

const UpsertSellerForm = ({
  isOpen,
  seller,
  onSuccess,
}: UpsertSellerFormProps) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: seller?.name ?? "",
      email: seller?.email ?? "",
      password: seller?.password ?? "",
      cpfNumber: seller?.cpfNumber ?? "",
      phoneNumber: seller?.phoneNumber ?? "",
      unity: seller?.unity ?? "",
    },
  });

  // Carregar clínicas
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: seller?.name ?? "",
        email: seller?.email ?? "",
        password: seller?.password ?? "",
        cpfNumber: seller?.cpfNumber ?? "",
        phoneNumber: seller?.phoneNumber ?? "",
        unity: seller?.unity ?? "",
      });
    }
    const loadClinics = async () => {
      try {
        const response = await fetch("/api/clinics");
        if (response.ok) {
          const clinicsData = await response.json();
          setClinics(clinicsData);
        }
      } catch (error) {
        console.error("Erro ao carregar clínicas:", error);
      }
    };

    loadClinics();
  }, [isOpen, seller, form]);

  const upsertSellerAction = useAction(upsertSeller, {
    onSuccess: () => {
      toast.success(
        seller
          ? "Vendedor atualizado com sucesso"
          : "Vendedor adicionado com sucesso",
      );
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao adicionar vendedor");
    },
  });
  const deleteSellerAction = useAction(deleteSeller, {
    onSuccess: () => {
      toast.success("Vendedor deletado com sucesso");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao deletar vendedor");
    },
  });
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    upsertSellerAction.execute({
      ...values,
      id: seller?.id,
    });
  };
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-amber-950">
          {seller ? seller.name : "Adicionar Vendedor"}
        </DialogTitle>
        <DialogDescription className="text-amber-800">
          {seller
            ? "Edite as informacoes do vendedor"
            : "Adicione um novo vendedor para gerenciar as vendas dos convenios."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-950">Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-950">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="exemplo@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-950">Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    {...field}
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
                <FormLabel className="text-amber-950">CPF</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o CPF" {...field} />
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
                  <Input placeholder="Digite o telefone" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-950">
                  Clínica do Vendedor
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a clínica" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {/* mudei para o id para testar */}
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription></FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            {seller && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <TrashIcon />
                    Deletar Vendedor
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Tem certeza que deseja deletar esse vendedor?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação não pode ser desfeita. Isso irá deletar o
                      vendedor permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        deleteSellerAction.execute({ id: seller.id })
                      }
                      className="bg-red-600 hover:bg-red-900"
                    >
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-900"
              disabled={upsertSellerAction.isPending}
            >
              {upsertSellerAction.isPending
                ? "Salvando..."
                : seller
                  ? "Atualizar"
                  : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertSellerForm;

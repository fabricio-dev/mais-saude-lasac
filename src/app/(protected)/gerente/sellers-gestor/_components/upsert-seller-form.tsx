import { zodResolver } from "@hookform/resolvers/zod";
import { TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
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
  cpfNumber: z.string().trim().min(11, { message: "CPF inválido" }),
  phoneNumber: z.string().trim().min(11, { message: "Telefone é obrigatório" }),
  clinicId: z.string().uuid().min(1, { message: "Unidade é obrigatória" }),
  percentage: z.coerce
    .number()
    .min(0, { message: "Porcentagem é obrigatória" })
    .max(100, { message: "Porcentagem máxima é 100%" }),
  pixKey: z.string().trim().optional(),
  pixKeyType: z.string().trim().optional(),
});

interface UpsertSellerFormProps {
  isOpen: boolean;
  seller?: typeof sellersTable.$inferSelect;
  onSuccess?: () => void;
  clinicId?: string; // ID da clínica do gestor
}

const UpsertSellerForm = ({
  isOpen,
  seller,
  onSuccess,
  clinicId,
}: UpsertSellerFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: seller?.name ?? "",
      email: seller?.email ?? "",
      cpfNumber: seller?.cpfNumber ?? "",
      phoneNumber: seller?.phoneNumber ?? "",
      clinicId: seller?.clinicId ?? clinicId ?? "",
      percentage: seller?.percentage ?? 10,
      pixKey: seller?.pixKey ?? "",
      pixKeyType: seller?.pixKeyType ?? "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: seller?.name ?? "",
        email: seller?.email ?? "",
        cpfNumber: seller?.cpfNumber ?? "",
        phoneNumber: seller?.phoneNumber ?? "",
        clinicId: seller?.clinicId ?? clinicId ?? "",
        percentage: seller?.percentage ?? 10,
        pixKey: seller?.pixKey ?? "",
        pixKeyType: seller?.pixKeyType ?? "",
      });
    }
  }, [isOpen, seller, clinicId, form]);

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
      clinicId: clinicId || values.clinicId, // Força a clínica do gestor
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
            ? "Edite as informações do vendedor"
            : "Adicione um novo vendedor para gerenciar as vendas dos convênios na sua unidade."}
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
            name="cpfNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-950">CPF</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Digite o CPF"
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
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-950">Telefone</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Digite o telefone"
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
            name="percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-950">Porcentagem</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pixKeyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-950">
                  Tipo de Chave PIX
                </FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo de chave" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CPF/CNPJ">CPF/CNPJ</SelectItem>
                      <SelectItem value="E-mail">E-mail</SelectItem>
                      <SelectItem value="Telefone">Telefone</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pixKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-950">Chave PIX</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    disabled={form.watch("pixKeyType") === ""}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo clinicId oculto para gestores - eles só podem adicionar vendedores na própria clínica */}
          <input
            type="hidden"
            {...form.register("clinicId")}
            value={clinicId}
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

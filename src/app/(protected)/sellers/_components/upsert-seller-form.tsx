import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertSeller } from "@/actions/upsert-seller";
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

import { unityCity } from "../_constants";

const formSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome é obrigatório" }),
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z
    .string()
    .trim()
    .min(8, { message: "Senha deve ter no mínimo 8 caracteres" }),
  cpfNumber: z.string().trim().min(11, { message: "CPF inválido" }),
  phoneNumber: z.string().trim().min(11, { message: "Telefone é obrigatório" }),
  unity: z.string().trim().min(1, { message: "Unidade é obrigatória" }),
});

interface UpsertSellerFormProps {
  onSuccess?: () => void;
}

const UpsertSellerForm = ({ onSuccess }: UpsertSellerFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      cpfNumber: "",
      phoneNumber: "",
      unity: "",
    },
  });

  const upsertSellerAction = useAction(upsertSeller, {
    onSuccess: () => {
      toast.success("Vendedor adicionado com sucesso");
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao adicionar vendedor");
    },
  });
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    upsertSellerAction.execute(values);
  };
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-amber-950">Adicionar Vendedor</DialogTitle>
        <DialogDescription className="text-amber-800">
          Adicione um novo vendedor para gerenciar as vendas dos convenios.
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                  Unidade do Vendedor
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* TODO: fazer consulta no banco de dados para pegar as unidades */}
                    {unityCity.map((unity) => (
                      <SelectItem key={unity.value} value={unity.value}>
                        {unity.label}
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
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-900"
              disabled={upsertSellerAction.isPending}
            >
              {upsertSellerAction.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertSellerForm;

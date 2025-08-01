"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { upsertClinic } from "@/actions/upsert-clinic";
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
import { clinicsTable } from "@/db/schema";

const formSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome da clínica é obrigatório" }),
});

interface UpsertClinicFormProps {
  clinic?: typeof clinicsTable.$inferSelect;
  onSuccess?: () => void;
}

const UpsertClinicForm = ({ clinic, onSuccess }: UpsertClinicFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: clinic?.name ?? "",
    },
  });

  const upsertClinicAction = useAction(upsertClinic, {
    onSuccess: () => {
      toast.success(
        clinic
          ? "Unidade atualizada com sucesso"
          : "Unidade adicionada com sucesso",
      );
      onSuccess?.();
    },
    onError: () => {
      toast.error("Erro ao salvar unidade");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    upsertClinicAction.execute({
      ...values,
      id: clinic?.id,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-amber-950">
          {clinic ? clinic.name : "Adicionar Unidade"}
        </DialogTitle>
        <DialogDescription className="text-amber-800">
          {clinic
            ? "Edite as informações da unidade"
            : "Adicione uma nova unidade para gerenciar pacientes e convênios."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-950">
                  Nome da Unidade
                </FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome da unidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="submit"
              disabled={upsertClinicAction.isExecuting}
              className="bg-emerald-600 hover:bg-emerald-900"
            >
              {upsertClinicAction.isExecuting
                ? "Salvando..."
                : clinic
                  ? "Atualizar"
                  : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertClinicForm;

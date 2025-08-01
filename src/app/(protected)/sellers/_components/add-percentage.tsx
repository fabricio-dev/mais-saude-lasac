"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const percentageFormSchema = z.object({
  percentage: z
    .string()
    .min(1, "Percentual é obrigatório")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100,
      {
        message: "Percentual deve estar entre 1 e 100",
      },
    ),
});

type PercentageFormData = z.infer<typeof percentageFormSchema>;

interface AddPercentageProps {
  onSubmit: (data: PercentageFormData) => void;
  isLoading?: boolean;
  currentPercentage?: number;
}

const AddPercentage = ({
  onSubmit,
  isLoading = false,
  currentPercentage,
}: AddPercentageProps) => {
  const form = useForm<PercentageFormData>({
    resolver: zodResolver(percentageFormSchema),
    defaultValues: {
      percentage: "",
    },
  });

  const handleSubmit = (data: PercentageFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="percentage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className="w-18"
                  type="number"
                  min="1"
                  max="100"
                  placeholder={
                    currentPercentage ? `${currentPercentage}%` : "%"
                  }
                  {...field}
                  disabled={isLoading}
                  onChange={(e) => {
                    field.onChange(e);
                    form.setValue("percentage", e.target.value);
                    // Submeter automaticamente quando o valor for válido
                    if (
                      e.target.value &&
                      !isNaN(Number(e.target.value)) &&
                      Number(e.target.value) > 0 &&
                      Number(e.target.value) <= 100
                    ) {
                      setTimeout(() => {
                        form.handleSubmit(handleSubmit)();
                      }, 1500); // Delay para evitar submissões múltiplas
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

export default AddPercentage;

"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const toneClasses = {
  amber: {
    label: "text-amber-950",
    item: "border-amber-400 text-amber-600 [&_svg]:fill-amber-600",
  },
  emerald: {
    label: "text-emerald-950",
    item: "border-emerald-400 text-emerald-600 [&_svg]:fill-emerald-600",
  },
} as const;

const options = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
] as const;

interface WhatsappConsentFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  tone: keyof typeof toneClasses;
  className?: string;
}

/**
 * Pergunta "Sim/Não" do consentimento de WhatsApp, sem opção pré-selecionada
 * em cadastro novo (o valor fica `undefined` até alguém escolher).
 */
export function WhatsappConsentField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  tone,
  className,
}: WhatsappConsentFieldProps<TFieldValues>) {
  const classes = toneClasses[tone];

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2", className)}>
          <FormLabel className={cn("text-sm font-medium", classes.label)}>
            {label}
          </FormLabel>
          <FormControl>
            <RadioGroup
              // "" deixa o grupo sem seleção, mantendo o componente controlado
              value={
                typeof field.value === "boolean" ? String(field.value) : ""
              }
              onValueChange={(value) => field.onChange(value === "true")}
              className="flex gap-6"
            >
              {options.map((option) => (
                <FormItem
                  key={option.value}
                  className="flex items-center gap-2 space-y-0"
                >
                  <FormControl>
                    <RadioGroupItem
                      value={option.value}
                      className={classes.item}
                    />
                  </FormControl>
                  <FormLabel
                    className={cn("text-sm font-normal", classes.label)}
                  >
                    {option.label}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

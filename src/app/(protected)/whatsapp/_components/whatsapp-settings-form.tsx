"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";

import { upsertWhatsAppSettings } from "@/actions/upsert-whatsapp-settings";
import {
  UpsertWhatsAppSettingsInput,
  upsertWhatsAppSettingsSchema,
} from "@/actions/upsert-whatsapp-settings/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";

const REMINDERS: {
  name: keyof Pick<
    UpsertWhatsAppSettingsInput,
    | "reminderD7Enabled"
    | "reminderD0Enabled"
    | "reminderD0LateEnabled"
    | "reminderD30Enabled"
  >;
  title: string;
  description: string;
}[] = [
  {
    name: "reminderD7Enabled",
    title: "7 dias antes do vencimento",
    description:
      "Quem vence nos próximos 7 dias, dos que vencem antes para os que vencem depois, até o limite por dia abaixo. O que não couber ou falhar sai no dia seguinte, até a véspera.",
  },
  {
    name: "reminderD0Enabled",
    title: "No dia do vencimento",
    description: "Só no próprio dia — o texto diz “hoje”.",
  },
  {
    name: "reminderD0LateEnabled",
    title: "Vencido sem aviso no dia",
    description:
      "“Seu cartão venceu em…”, para quem não recebeu o aviso do dia (até 29 dias depois). Ligue só depois que o modelo lembrete_vencimento_atrasado for aprovado na Meta.",
  },
  {
    name: "reminderD30Enabled",
    title: "30 dias ou mais vencido",
    description:
      "Para quem venceu há 30 dias ou mais, dos mais recentes para os mais antigos, até o limite por dia abaixo.",
  },
];

const WEEK_DAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

interface WhatsAppSettingsFormProps {
  defaultValues: UpsertWhatsAppSettingsInput;
}

const WhatsAppSettingsForm = ({ defaultValues }: WhatsAppSettingsFormProps) => {
  const form = useForm<UpsertWhatsAppSettingsInput>({
    resolver: zodResolver(upsertWhatsAppSettingsSchema),
    defaultValues,
  });

  const saveAction = useAction(upsertWhatsAppSettings, {
    onSuccess: () => {
      toast.success("Configurações salvas");
      form.reset(form.getValues());
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao salvar configurações");
    },
  });

  const enabled = form.watch("enabled");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => saveAction.execute(values))}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Envios</CardTitle>
            <CardDescription>
              Confirmação de cadastro, lista de parceiros e lembretes de
              vencimento saem pelo sistema de atendimento, no número da Lasac.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <FormLabel>Enviar mensagens de WhatsApp</FormLabel>
                    <FormDescription>
                      Desligado, nada sai — nem a confirmação de cadastro.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lembretes de vencimento</CardTitle>
            <CardDescription>
              Cada paciente recebe cada lembrete uma vez por ciclo. Quem renova
              antes não recebe os seguintes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {REMINDERS.map((reminder) => (
              <FormField
                key={reminder.name}
                control={form.control}
                name={reminder.name}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-1">
                      <FormLabel>{reminder.title}</FormLabel>
                      <FormDescription>{reminder.description}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!enabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}

            <div className="grid gap-4 pt-2 md:grid-cols-2">
              <FormField
                control={form.control}
                name="d7DailyLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite por dia (7 dias antes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={250}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormDescription className="space-y-1">
                      <span className="block">
                        Na primeira vez o sistema junta uma semana de
                        vencimentos. Com o limite, quem vence antes recebe
                        primeiro e o resto sai nos dias seguintes, ainda dentro
                        da janela.
                      </span>
                      <span className="block">
                        Dividido com o atendimento nas 250 conversas por dia do
                        número. No dia a dia sai bem menos que o limite.
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overdueDailyLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite por dia (vencidos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={250}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormDescription className="space-y-1">
                      <span className="block">
                        Vale para os vencidos há menos e há mais de 30 dias,
                        juntos. O número entrega 250 conversas por dia, dividido
                        com o atendimento.
                      </span>
                      <span className="block">
                        O &ldquo;venceu há pouco&rdquo; roda primeiro e usa o
                        limite; o &ldquo;30 dias ou mais&rdquo; fica só com o
                        que sobrar.
                      </span>
                      <span className="block">
                        Exemplo com limite 100: se o primeiro enviar 100, o
                        segundo não envia nenhum nesse dia; se enviar 15, o
                        segundo pode mandar até 85.
                      </span>
                      <span className="block">
                        Quando o primeiro não tiver mais ninguém na fila, o
                        limite inteiro passa para o segundo.
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="officialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de contato nos lembretes</FormLabel>
                    <FormControl>
                      <PatternFormat
                        format="(##) #####-####"
                        mask="_"
                        placeholder="(87) 99999-9999"
                        customInput={Input}
                        value={field.value}
                        onValueChange={(values) => field.onChange(values.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Vai no link wa.me da mensagem.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horário do disparo</CardTitle>
            <CardDescription>
              Os lembretes saem uma vez por dia, a partir da hora escolhida.
              Prefira um horário com atendimento: muita gente responde.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="sendHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {HOURS.map((hour) => (
                        <SelectItem key={hour} value={String(hour)}>
                          {String(hour).padStart(2, "0")}:00
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
              name="sendDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const selected = field.value.includes(day.value);
                      return (
                        <Button
                          key={day.value}
                          type="button"
                          size="sm"
                          variant={selected ? "default" : "outline"}
                          aria-pressed={selected}
                          onClick={() =>
                            field.onChange(
                              selected
                                ? field.value.filter((d) => d !== day.value)
                                : [...field.value, day.value],
                            )
                          }
                        >
                          {day.label}
                        </Button>
                      );
                    })}
                  </div>
                  <FormDescription>
                    O aviso do dia do vencimento não sai em dia desmarcado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saveAction.isPending || !form.formState.isDirty}
          >
            {saveAction.isPending ? "Salvando…" : "Salvar configurações"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default WhatsAppSettingsForm;

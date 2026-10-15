"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { saveMessageTemplateAction } from "@/actions/save-message-template";
import {
  SaveMessageTemplateInput,
  saveMessageTemplateSchema,
} from "@/actions/save-message-template/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
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
import type { WhatsAppAiTemplate } from "@/lib/whatsapp/client";
import {
  buildTemplateParameters,
  MESSAGE_KEYS,
  MESSAGE_LABELS,
  type MessageKey,
  type MessageTemplateConfig,
  renderTemplateBody,
  templateMismatch,
  VARIABLE_SOURCE_LABELS,
  VARIABLE_SOURCES,
  type VariableSource,
} from "@/lib/whatsapp/message-templates";

type MessageTemplateRow = MessageTemplateConfig & { isDefault: boolean };

interface MessageTemplatesCardProps {
  messages: Record<MessageKey, MessageTemplateRow>;
  catalog:
    | { ok: true; templates: WhatsAppAiTemplate[] }
    | {
        ok: false;
        message: string;
      };
  officialNumber: string | null;
}

const templateId = (template: { name: string; language: string }) =>
  `${template.name}|${template.language}`;

const MessageTemplatesCard = ({
  messages,
  catalog,
  officialNumber,
}: MessageTemplatesCardProps) => {
  const [editing, setEditing] = useState<MessageKey | null>(null);

  const describe = (row: MessageTemplateRow) =>
    row.params.length === 0
      ? "sem variáveis"
      : row.params
          .map((param, index) =>
            param.source === "fixed_text"
              ? `{{${index + 1}}} “${param.text}”`
              : `{{${index + 1}}} ${VARIABLE_SOURCE_LABELS[param.source].toLowerCase()}`,
          )
          .join(" · ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modelos das mensagens</CardTitle>
        <CardDescription>
          Qual modelo aprovado sai em cada mensagem e o que vai em cada
          variável. Os modelos são criados e aprovados no sistema de
          atendimento, em Configurações → Modelos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!catalog.ok ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {catalog.message} Sem a lista de modelos, dá para ver o que está
            configurado, mas não alterar.
          </p>
        ) : null}

        {MESSAGE_KEYS.map((key) => {
          const row = messages[key];
          return (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{MESSAGE_LABELS[key].title}</p>
                <p className="text-muted-foreground text-sm">
                  <span className="font-mono">{row.templateName}</span>
                  {row.isDefault ? (
                    <Badge variant="secondary" className="ml-2">
                      padrão
                    </Badge>
                  ) : null}
                </p>
                <p className="text-muted-foreground text-xs">{describe(row)}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!catalog.ok}
                onClick={() => setEditing(key)}
              >
                Alterar
              </Button>
            </div>
          );
        })}
      </CardContent>

      {editing && catalog.ok ? (
        <MessageTemplateDialog
          key={editing}
          messageKey={editing}
          current={messages[editing]}
          // Os não suportados ficam na lista, desabilitados, com o motivo.
          templates={catalog.templates.filter(
            (template) =>
              template.unsupported !== null ||
              templateMismatch(editing, template) === null,
          )}
          officialNumber={officialNumber}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Card>
  );
};

function MessageTemplateDialog({
  messageKey,
  current,
  templates,
  officialNumber,
  onClose,
}: {
  messageKey: MessageKey;
  current: MessageTemplateRow;
  templates: WhatsAppAiTemplate[];
  officialNumber: string | null;
  onClose: () => void;
}) {
  const form = useForm<SaveMessageTemplateInput>({
    resolver: zodResolver(saveMessageTemplateSchema),
    defaultValues: {
      key: messageKey,
      templateName: current.templateName,
      templateLanguage: current.templateLanguage,
      params: current.params,
    },
  });

  const saveAction = useAction(saveMessageTemplateAction, {
    onSuccess: ({ data }) => {
      if (data && !data.ok) {
        toast.error(data.message);
        return;
      }
      toast.success("Modelo salvo");
      onClose();
    },
    onError: (error) =>
      toast.error(error.error.serverError || "Erro ao salvar o modelo"),
  });

  const name = form.watch("templateName");
  const language = form.watch("templateLanguage");
  const params = form.watch("params");
  const selected = templates.find(
    (template) => template.name === name && template.language === language,
  );

  const chooseTemplate = (id: string) => {
    const template = templates.find((item) => templateId(item) === id);
    if (!template) return;
    form.setValue("templateName", template.name, { shouldDirty: true });
    form.setValue("templateLanguage", template.language, { shouldDirty: true });
    // Mantém o que já estava nas posições que continuam existindo.
    form.setValue(
      "params",
      Array.from(
        { length: template.variables },
        (_, index) => params[index] ?? { source: "first_name" as const },
      ),
      { shouldDirty: true },
    );
  };

  const preview = selected
    ? renderTemplateBody(
        selected.body,
        buildTemplateParameters(params, {
          patientName: "Maria da Silva",
          expirationDate: dayjs().add(7, "day").toDate(),
          clinicName: "Clínica Exemplo",
          officialNumber,
        }),
      )
    : null;

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{MESSAGE_LABELS[messageKey].title}</DialogTitle>
          <DialogDescription>
            {MESSAGE_LABELS[messageKey].description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => saveAction.execute(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="templateName"
              render={() => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <Select
                    value={selected ? templateId(selected) : undefined}
                    onValueChange={chooseTemplate}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            templates.length === 0
                              ? "Nenhum modelo aprovado serve aqui"
                              : `${current.templateName} (não está mais aprovado)`
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem
                          key={templateId(template)}
                          value={templateId(template)}
                          disabled={Boolean(template.unsupported)}
                        >
                          {template.name} · {template.language}
                          {template.unsupported ? " — não suportado" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selected?.unsupported ? (
                    <FormDescription>{selected.unsupported}</FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            {selected && selected.variables > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Variáveis</p>
                {params.map((param, index) => (
                  <div
                    key={index}
                    className="grid gap-2 md:grid-cols-[4rem_1fr_1fr] md:items-start"
                  >
                    <span className="text-muted-foreground pt-2 font-mono text-sm">
                      {`{{${index + 1}}}`}
                    </span>
                    <FormField
                      control={form.control}
                      name={`params.${index}.source`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            value={field.value}
                            onValueChange={(value) =>
                              field.onChange(value as VariableSource)
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {VARIABLE_SOURCES.map((source) => (
                                <SelectItem key={source} value={source}>
                                  {VARIABLE_SOURCE_LABELS[source]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selected.examples[index] ? (
                            <FormDescription>
                              Exemplo aprovado: {selected.examples[index]}
                            </FormDescription>
                          ) : null}
                        </FormItem>
                      )}
                    />
                    {param.source === "fixed_text" ? (
                      <FormField
                        control={form.control}
                        name={`params.${index}.text`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Texto"
                                maxLength={200}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {selected && preview !== null ? (
              <div className="bg-muted/40 space-y-2 rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground text-xs">
                  Prévia, com uma paciente de exemplo
                </p>
                {selected.headerFormat === "DOCUMENT" ? (
                  <p className="text-muted-foreground text-xs">
                    📄 Lista de Parceiros - Mais Saúde.pdf
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap">{preview}</p>
                {selected.footer ? (
                  <p className="text-muted-foreground text-xs">
                    {selected.footer}
                  </p>
                ) : null}
                {selected.buttons.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selected.buttons.map((button) => (
                      <Badge key={button.text} variant="outline">
                        {button.text}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveAction.isPending || !selected}
              >
                {saveAction.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default MessageTemplatesCard;

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { Copy, KeyRound } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { generateIntegrationKey } from "@/actions/generate-integration-key";
import { saveWhatsAppConnection } from "@/actions/save-whatsapp-connection";
import {
  SaveWhatsAppConnectionInput,
  saveWhatsAppConnectionSchema,
} from "@/actions/save-whatsapp-connection/schema";
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
import { Label } from "@/components/ui/label";
import type { WhatsAppConnectionView } from "@/data/whatsapp-connection";

interface WhatsAppConnectionCardProps {
  connection: WhatsAppConnectionView;
  /** Endereço público deste sistema, sem barra no fim (ex.: https://app.com). */
  appUrl: string;
}

const PATIENT_LOOKUP_PATH = "/api/integrations/v1/patient-lookup";

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

const copyToClipboard = async (value: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error("Não foi possível copiar. Selecione o texto e copie.");
  }
};

interface CopyableFieldProps {
  label: string;
  value: string;
  description?: string;
}

const CopyableField = ({ label, value, description }: CopyableFieldProps) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex items-center gap-2">
      <Input readOnly value={value} className="font-mono text-xs" />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Copiar ${label.toLowerCase()}`}
        disabled={!value}
        onClick={() => copyToClipboard(value, `${label} copiado`)}
      >
        <Copy className="size-4" />
      </Button>
    </div>
    {description ? (
      <p className="text-muted-foreground text-sm">{description}</p>
    ) : null}
  </div>
);

const WhatsAppConnectionCard = ({
  connection,
  appUrl,
}: WhatsAppConnectionCardProps) => {
  const [newKey, setNewKey] = useState<string | null>(null);
  const lookupUrl = appUrl ? `${appUrl}${PATIENT_LOOKUP_PATH}` : "";

  const form = useForm<SaveWhatsAppConnectionInput>({
    resolver: zodResolver(saveWhatsAppConnectionSchema),
    defaultValues: { url: connection.url ?? "", apiKey: "" },
  });

  const saveAction = useAction(saveWhatsAppConnection, {
    onSuccess: ({ data }) => {
      if (data && !data.ok) {
        toast.error(data.message);
        return;
      }
      toast.success("Conexão salva");
      form.reset({ url: form.getValues("url"), apiKey: "" });
    },
    onError: (error) =>
      toast.error(error.error.serverError || "Erro ao salvar a conexão"),
  });

  const generateAction = useAction(generateIntegrationKey, {
    onSuccess: ({ data }) => {
      if (data) setNewKey(data.rawKey);
    },
    onError: (error) =>
      toast.error(error.error.serverError || "Erro ao gerar a chave"),
  });

  const copyKey = () => {
    if (newKey) copyToClipboard(newKey, "Chave copiada");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Conexão com o sistema de atendimento</CardTitle>
          <CardDescription>
            O WhatsApp sai pelo sistema de atendimento (whatsapp-ai). A chave é
            gerada lá, em Configurações → Integrações → Envio pelo seu sistema,
            e fica guardada aqui criptografada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                saveAction.execute(values),
              )}
              className="space-y-4"
            >
              {!connection.encryptionConfigured ? (
                <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Falta a variável SETTINGS_ENCRYPTION_KEY no servidor. Sem ela,
                  o endereço pode ser salvo, mas a chave não.
                </p>
              ) : null}

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://atendimento.seudominio.com.br"
                        {...field}
                      />
                    </FormControl>
                    {connection.urlFromEnv ? (
                      <FormDescription>
                        Vindo do arquivo .env. Salve aqui para gerenciar pela
                        tela.
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave de envio</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="off"
                        placeholder={
                          connection.apiKeyMasked
                            ? `Atual: ${connection.apiKeyMasked}`
                            : "wai_…"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {connection.apiKeyMasked
                        ? `Deixe em branco para manter a atual${connection.apiKeyFromEnv ? " (do arquivo .env)" : ""}.`
                        : "Nenhuma chave configurada: nada sai pelo WhatsApp."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveAction.isPending || !form.formState.isDirty}
                >
                  {saveAction.isPending ? "Salvando…" : "Salvar conexão"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chave da consulta de cartão</CardTitle>
          <CardDescription>
            O atendimento usa esta chave para consultar se o cartão do paciente
            está ativo. Cole no whatsapp-ai, em Configurações → Integrações, na
            consulta do cartão, o endereço da API e a chave. Se lá houver lista
            de hosts liberados, inclua o host abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {lookupUrl ? (
            <div className="grid gap-4 md:grid-cols-2">
              <CopyableField
                label="Endereço da API"
                value={lookupUrl}
                description="Chamada por POST, com a chave no cabeçalho X-Api-Key."
              />
              <CopyableField
                label="Host"
                value={hostOf(appUrl)}
                description="Para liberar na outra plataforma."
              />
            </div>
          ) : (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Falta a variável NEXT_PUBLIC_APP_URL no servidor: sem ela não há
              como mostrar o endereço da API.
            </p>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-sm">
              <KeyRound className="text-muted-foreground size-6 shrink-0" />
              {connection.integrationKeyPrefix ? (
                <div>
                  <p className="font-mono">{connection.integrationKeyPrefix}</p>
                  <p className="text-muted-foreground">
                    {connection.integrationKeyFromEnv
                      ? "Vinda do arquivo .env"
                      : connection.integrationKeyCreatedAt
                        ? `Gerada em ${dayjs(connection.integrationKeyCreatedAt).format("DD/MM/YYYY HH:mm")}`
                        : null}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Nenhuma chave: o atendimento não consegue consultar o cartão.
                </p>
              )}
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={generateAction.isPending}>
                  {generateAction.isPending ? "Gerando…" : "Gerar nova chave"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Gerar nova chave?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A chave atual para de funcionar na hora. Até a nova ser
                    colada no whatsapp-ai, o atendimento não consegue consultar
                    cartões.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => generateAction.execute()}>
                    Gerar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={newKey !== null}
        onOpenChange={(open) => {
          if (!open) setNewKey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chave gerada</DialogTitle>
            <DialogDescription>
              Esta é a única vez que a chave aparece — o sistema guarda só uma
              impressão dela. Copie e cole no whatsapp-ai agora.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={newKey ?? ""}
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copiar chave"
              onClick={copyKey}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKey(null)}>Já copiei</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WhatsAppConnectionCard;

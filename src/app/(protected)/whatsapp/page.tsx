import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import {
  getPartnersListFileInfo,
  PARTNERS_LIST_PATH,
} from "@/data/partners-list-file";
import { getWhatsAppConnectionView } from "@/data/whatsapp-connection";
import { getMessageTemplates } from "@/data/whatsapp-message-templates";
import {
  getWhatsAppSettings,
  toInput,
  type WhatsAppSettings,
} from "@/data/whatsapp-settings";
import { requireRole } from "@/lib/require-role";
import { listWhatsAppAiTemplates } from "@/lib/whatsapp/client";

import MessageTemplatesCard from "./_components/message-templates-card";
import PartnersListUpload from "./_components/partners-list-upload";
import WhatsAppConnectionCard from "./_components/whatsapp-connection-card";
import WhatsAppSettingsForm from "./_components/whatsapp-settings-form";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Sao_Paulo";

/**
 * O campo usa o formato do cadastro (DDD + número). O .env antigo pode ter o
 * 55 na frente — pelo tamanho, para não cortar o DDD 55.
 */
function withoutCountryCode(phone: string | null): string {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits.length >= 12 && digits.startsWith("55")
    ? digits.slice(2)
    : digits;
}

/** Quando os lembretes saem da próxima vez, pelas configurações salvas. */
function nextRun(settings: WhatsAppSettings): string | null {
  if (!settings.enabled || settings.sendDays.length === 0) return null;

  const now = dayjs().tz(TIMEZONE);
  for (let offset = 0; offset <= 7; offset++) {
    const day = now.add(offset, "day");
    if (!settings.sendDays.includes(day.day())) continue;
    if (offset === 0 && settings.lastRunOn === day.format("YYYY-MM-DD")) {
      continue;
    }
    const at = day.hour(settings.sendHour).minute(0);
    // Hoje, já passou da hora e ainda não rodou: sai na próxima chamada do
    // cron, que é de hora em hora.
    if (offset === 0 && now.isAfter(at)) return "na próxima hora cheia";
    return at.format(offset === 0 ? "[hoje às] HH:mm" : "DD/MM [às] HH:mm");
  }
  return null;
}

const WhatsAppPage = async () => {
  await requireRole("admin");

  const [settings, partnersFile, connection, messages, catalog] =
    await Promise.all([
      getWhatsAppSettings(),
      getPartnersListFileInfo(),
      getWhatsAppConnectionView(),
      getMessageTemplates(),
      listWhatsAppAiTemplates(),
    ]);

  const proximo = nextRun(settings);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "";

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>WhatsApp</PageTitle>
          <PageDescription>
            O que sai pelo WhatsApp, quando sai e com qual arquivo. Entregas,
            leituras e respostas ficam no sistema de atendimento, em Envios
            automáticos.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
              <Badge variant={settings.enabled ? "default" : "secondary"}>
                {settings.enabled ? "Envios ligados" : "Envios desligados"}
              </Badge>
              <span>
                <span className="text-muted-foreground">Último disparo: </span>
                {settings.lastRunOn
                  ? dayjs(settings.lastRunOn).format("DD/MM/YYYY")
                  : "nenhum ainda"}
              </span>
              <span>
                <span className="text-muted-foreground">Próximo: </span>
                {proximo ?? "—"}
              </span>
              {settings.isDefault ? (
                <span className="text-muted-foreground">
                  Ainda não salvo aqui: valem os valores do arquivo .env.
                </span>
              ) : null}
            </CardContent>
          </Card>

          <WhatsAppConnectionCard connection={connection} />

          <MessageTemplatesCard
            messages={messages}
            catalog={catalog}
            officialNumber={settings.officialNumber}
          />

          <WhatsAppSettingsForm
            defaultValues={{
              ...toInput(settings),
              officialNumber: withoutCountryCode(settings.officialNumber),
            }}
          />

          <PartnersListUpload
            file={partnersFile}
            publicUrl={`${appUrl}${PARTNERS_LIST_PATH}`}
          />
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default WhatsAppPage;

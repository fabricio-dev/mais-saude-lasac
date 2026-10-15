"use client";

import dayjs from "dayjs";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";

import { getPatientWhatsAppNotifications } from "@/actions/get-patient-whatsapp-notifications";
import { Badge } from "@/components/ui/badge";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TYPE_LABELS: Record<string, string> = {
  RENEWAL_D_7: "7 dias antes",
  RENEWAL_D_0: "No dia do vencimento",
  RENEWAL_D_0_LATE: "Vencido sem aviso no dia",
  RENEWAL_D_30: "30 dias ou mais vencido",
};

const STATUS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  sent: { label: "Enviado", variant: "default" },
  pending: { label: "Enviando", variant: "secondary" },
  failed: { label: "Não enviado", variant: "destructive" },
};

/**
 * Os lembretes de vencimento deste paciente no ciclo atual — a renovação apaga
 * os do ciclo anterior. Entrega e leitura ficam no sistema de atendimento.
 */
const PatientWhatsAppNotifications = ({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) => {
  const { execute, result, isPending } = useAction(
    getPatientWhatsAppNotifications,
  );

  useEffect(() => {
    execute({ patientId });
  }, [execute, patientId]);

  const rows = result.data ?? [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Lembretes de WhatsApp</DialogTitle>
        <DialogDescription>
          Lembretes de vencimento de {patientName} no ciclo atual. Entregue,
          lido e respondido ficam no sistema de atendimento, na ficha do
          paciente.
        </DialogDescription>
      </DialogHeader>

      {isPending ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Carregando…
        </p>
      ) : result.serverError ? (
        <p className="text-destructive py-6 text-center text-sm">
          Não foi possível carregar os lembretes.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Nenhum lembrete neste ciclo ainda.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lembrete</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Quando</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const status = STATUS[row.status] ?? STATUS.pending;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    {TYPE_LABELS[row.notificationType] ?? row.notificationType}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {dayjs(row.sentAt ?? row.createdAt).format(
                      "DD/MM/YYYY HH:mm",
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-56 text-xs whitespace-normal">
                    {row.failureReason ?? ""}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
};

export default PatientWhatsAppNotifications;

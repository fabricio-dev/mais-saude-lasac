"use client";

import { Download } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { exportExpiredContacts } from "@/actions/export-expired-contacts";
import type { ExportExpiredContactsSchema } from "@/actions/export-expired-contacts/schema";
import { Button } from "@/components/ui/button";

interface ExportExpiredContactsButtonProps {
  filters: ExportExpiredContactsSchema;
  disabled?: boolean;
}

const downloadFile = (fileName: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const ExportExpiredContactsButton = ({
  filters,
  disabled,
}: ExportExpiredContactsButtonProps) => {
  const exportAction = useAction(exportExpiredContacts, {
    onSuccess: ({ data }) => {
      if (!data) return;
      downloadFile(data.fileName, data.csv);
      toast.success(
        `${data.count} ${data.count === 1 ? "contato exportado" : "contatos exportados"}`,
      );
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao exportar contatos");
    },
  });

  return (
    <Button
      variant="outline"
      onClick={() => exportAction.execute(filters)}
      disabled={disabled || exportAction.isPending}
    >
      <Download className="h-4 w-4" />
      {exportAction.isPending ? "Exportando..." : "Exportar contatos vencidos"}
    </Button>
  );
};

export default ExportExpiredContactsButton;

"use client";

import dayjs from "dayjs";
import { FileText, Upload } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRef } from "react";
import { toast } from "sonner";

import { uploadPartnersList } from "@/actions/upload-partners-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAX_BYTES = 10 * 1024 * 1024;

interface PartnersListUploadProps {
  file: { fileName: string; sizeBytes: number; updatedAt: Date } | null;
  publicUrl: string;
}

const PartnersListUpload = ({ file, publicUrl }: PartnersListUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadAction = useAction(uploadPartnersList, {
    onSuccess: () => toast.success("Lista de parceiros atualizada"),
    onError: (error) =>
      toast.error(error.error.serverError || "Erro ao enviar o arquivo"),
  });

  const handleFile = (selected: File | undefined) => {
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast.error("Escolha um arquivo PDF");
      return;
    }
    if (selected.size > MAX_BYTES) {
      toast.error("O arquivo passa de 10 MB");
      return;
    }
    const formData = new FormData();
    formData.append("file", selected);
    uploadAction.execute(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de parceiros</CardTitle>
        <CardDescription>
          O PDF enviado logo depois da confirmação de cadastro e de renovação.
          Trocar aqui vale para o próximo envio.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <FileText className="text-muted-foreground size-8 shrink-0" />
          <div className="text-sm">
            {file ? (
              <>
                <p className="font-medium">{file.fileName}</p>
                <p className="text-muted-foreground">
                  {(file.sizeBytes / 1024).toFixed(0)} KB · enviado em{" "}
                  {dayjs(file.updatedAt).format("DD/MM/YYYY HH:mm")}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Arquivo original do sistema</p>
                <p className="text-muted-foreground">
                  Nenhum arquivo enviado por aqui ainda.
                </p>
              </>
            )}
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Ver o PDF atual
            </a>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploadAction.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          {uploadAction.isPending ? "Enviando…" : "Trocar PDF"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PartnersListUpload;

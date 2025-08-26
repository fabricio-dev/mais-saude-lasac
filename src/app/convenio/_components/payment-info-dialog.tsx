"use client";

import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentInfoDialog({
  open,
  onOpenChange,
}: PaymentInfoDialogProps) {
  const handleWhatsAppClick = () => {
    const phoneNumber = "5587999252333"; // Número com código do país
    const message =
      "Olá! Gostaria de enviar o comprovante de pagamento do convênio.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyPixKey = async () => {
    try {
      await navigator.clipboard.writeText("87 999252333");
      toast.success("Chave PIX copiada!");
    } catch {
      toast.error("Erro ao copiar chave PIX");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-emerald-900">
            Informações de Pagamento PIX
          </DialogTitle>
          <DialogDescription className="text-center">
            Escaneie o QR Code ou use a chave PIX para realizar o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code PIX */}
          <div className="flex justify-center">
            <Image
              src="/QR-pix.svg"
              alt="QR Code PIX"
              width={256}
              height={256}
              className="h-64 w-64"
            />
          </div>

          {/* Chave PIX */}
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Chave PIX (Telefone):
            </p>
            <div className="flex items-center justify-center space-x-2">
              <span className="font-mono text-lg font-bold text-gray-900">
                87 999252333
              </span>
              <Button
                onClick={handleCopyPixKey}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
              >
                📋
              </Button>
            </div>
          </div>

          {/* Instruções */}
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600">
              Após realizar o pagamento, envie o comprovante pelo WhatsApp:
            </p>

            {/* Botão WhatsApp */}
            <Button
              onClick={handleWhatsAppClick}
              className="w-full bg-green-600 text-white hover:bg-green-700"
            >
              <span className="mr-2">📱</span>
              Enviar Comprovante - (87) 99925-2333
            </Button>

            <p className="text-xs text-gray-500">
              Após o envio do comprovante, entraremos em contato para confirmar
              o cadastro.
            </p>
          </div>

          {/* Botão Fechar */}
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

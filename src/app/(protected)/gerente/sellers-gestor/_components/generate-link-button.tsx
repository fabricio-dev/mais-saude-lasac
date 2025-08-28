"use client";

import { Copy, ExternalLink, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GenerateLinkButtonProps {
  sellerId: string;
  sellerName: string;
}

export default function GenerateLinkButton({
  sellerId,
  sellerName,
}: GenerateLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [personalLink, setPersonalLink] = useState("");

  // Gerar o link personalizado apenas no cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPersonalLink(`${window.location.origin}/convenio/${sellerId}`);
    }
  }, [sellerId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(personalLink);
      toast.success("Link copiado para a área de transferência!");
    } catch (error) {
      console.error("Erro ao copiar:", error);
      toast.error("Erro ao copiar o link");
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Seja um Conveniado - Mais Saúde Lasac",
          text: `${sellerName} te convida para ser um conveniado da Mais Saúde Lasac!`,
          url: personalLink,
        });
      } catch (error) {
        console.error("Erro ao compartilhar:", error);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const openLink = () => {
    window.open(personalLink, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1">
          <Share2 className="mr-2 h-4 w-4" />
          Gerar Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Personalizado</DialogTitle>
          <DialogDescription>
            Compartilhe este link para que clientes se cadastrem e sejam
            automaticamente associados a {sellerName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="link">Link personalizado do vendedor:</Label>
            <div className="flex">
              <Input
                id="link"
                value={personalLink}
                readOnly
                className="rounded-r-none"
                placeholder={personalLink ? personalLink : "Carregando..."}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-l-none"
                onClick={copyToClipboard}
                disabled={!personalLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-emerald-50 p-4">
            <h4 className="font-semibold text-emerald-900">Como funciona:</h4>
            <ul className="mt-2 space-y-1 text-sm text-emerald-700">
              <li>• Clientes acessam o link personalizado do vendedor</li>
              <li>• Preenchem o formulário de convênio</li>
              <li>• São automaticamente associados ao vendedor e à unidade</li>
              <li>• Vendedor recebe a comissão pela venda</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <div className="flex w-full flex-col gap-2">
            <Button
              onClick={shareLink}
              className="w-full"
              disabled={!personalLink}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar Link
            </Button>
            <Button
              variant="outline"
              onClick={openLink}
              className="w-full"
              disabled={!personalLink}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Testar Link
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

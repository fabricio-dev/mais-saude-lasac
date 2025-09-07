"use client";

import {
  Building2,
  DollarSign,
  KeyRound,
  PencilIcon,
  Percent,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { sellersTable } from "@/db/schema";

import GenerateLinkButton from "./generate-link-button";
import UpsertSellerForm from "./upsert-seller-form";

interface SellerCardProps {
  seller: typeof sellersTable.$inferSelect & {
    patientsCount: number;
    clinicName: string | null;
    enterpriseCount: number;
  };
}
const SellerCard = ({ seller }: SellerCardProps) => {
  const [isUpsertSellerFormOpen, setIsUpsertSellerFormOpen] = useState(false);

  const sellerInitials = seller.name
    .split(" ")
    .slice(0, 2)
    .map((name) => name[0])
    .join("");

  // Calcular valor dos convênios vendidos (pacientes individual * R$ 100,00) + (pacientes de empresas * R$ 90,00)
  const conveniosValue =
    (seller.patientsCount - seller.enterpriseCount) * 100 +
    seller.enterpriseCount * 90;

  // Formatar valor como moeda brasileira
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{sellerInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{seller.name}</h3>
            <p className="text-muted-foreground text-sm">{seller.email}</p>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-2">
        <Badge variant="outline" className="justify-between">
          <div className="flex items-center">
            <Building2 className="mr-2 h-4 w-4" />
            Unidade:
          </div>
          <span className="font-semibold">
            {seller.clinicName || "Sem clínica"}
          </span>
        </Badge>
        <Badge variant="outline" className="justify-between">
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Convênios totais:
          </div>
          <span className="font-semibold">{seller.patientsCount}</span>
        </Badge>
        <Badge variant="outline" className="justify-between">
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Convênios de empresas:
          </div>
          <span className="font-semibold">{seller.enterpriseCount}</span>
        </Badge>
        <Badge variant="outline" className="justify-between">
          <div className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4" />
            Faturamento:
          </div>
          <span className="font-semibold">
            {formatCurrency(conveniosValue)}
          </span>
        </Badge>

        <Badge variant="outline" className="justify-between">
          <div className="flex items-center">
            <Percent className="mr-2 h-4 w-4" />
            Comissão:
          </div>
          <span className="font-semibold">
            {formatCurrency(conveniosValue * (seller.percentage / 100))}
          </span>
        </Badge>
        <Badge variant="outline" className="justify-between">
          <div className="flex items-center">
            <KeyRound className="mr-2 h-4 w-4" />
            Tipo de Chave PIX:
          </div>
          <span className="font-semibold">{seller.pixKeyType}</span>
        </Badge>
        <Badge variant="outline" className="justify-between">
          <div className="flex items-center">
            <KeyRound className="mr-2 h-4 w-4" />
            Chave PIX:
          </div>
          <span className="font-semibold">{seller.pixKey}</span>
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter className="flex gap-2">
        <Dialog
          open={isUpsertSellerFormOpen}
          onOpenChange={setIsUpsertSellerFormOpen}
        >
          <DialogTrigger asChild>
            <Button className="flex-1 bg-red-800 hover:bg-red-900">
              <PencilIcon className="mr-1" />
              Editar
            </Button>
          </DialogTrigger>
          <UpsertSellerForm
            isOpen={isUpsertSellerFormOpen}
            seller={seller}
            onSuccess={() => setIsUpsertSellerFormOpen(false)}
          />
        </Dialog>
        <GenerateLinkButton sellerId={seller.id} sellerName={seller.name} />
      </CardFooter>
    </Card>
  );
};

export default SellerCard;

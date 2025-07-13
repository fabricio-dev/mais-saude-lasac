"use client";

import { Building2, DollarSign, PencilIcon, Users } from "lucide-react";
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

import UpsertSellerForm from "./upsert-seller-form";

interface SellerCardProps {
  seller: typeof sellersTable.$inferSelect & {
    patientsCount: number;
    clinicName: string | null;
  };
}
const SellerCard = ({ seller }: SellerCardProps) => {
  const [isUpsertSellerFormOpen, setIsUpsertSellerFormOpen] = useState(false);
  const sellerInitials = seller.name
    .split(" ")
    .map((name) => name[0])
    .join("");

  // Calcular valor dos convênios vendidos (pacientes * R$ 100,00)
  const conveniosValue = seller.patientsCount * 100;

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
            <Users className="mr-2 h-4 w-4" />
            Pacientes Cadastrados
          </div>
          <span className="font-semibold">{seller.patientsCount}</span>
        </Badge>
        <Badge variant="outline" className="justify-between">
          <div className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4" />
            Convênios Vendidos
          </div>
          <span className="font-semibold">
            {formatCurrency(conveniosValue)}
          </span>
        </Badge>
        <Badge variant="outline" className="justify-between">
          <div className="flex items-center">
            <Building2 className="mr-2 h-4 w-4" />
            Clínica
          </div>
          <span className="font-semibold">
            {seller.clinicName || "Sem clínica"}
          </span>
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter>
        <Dialog
          open={isUpsertSellerFormOpen}
          onOpenChange={setIsUpsertSellerFormOpen}
        >
          <DialogTrigger asChild>
            <Button className="w-full bg-red-800 hover:bg-red-900">
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
      </CardFooter>
    </Card>
  );
};

export default SellerCard;

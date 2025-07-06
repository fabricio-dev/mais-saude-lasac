"use client";

import { CalendarIcon, ClockIcon, PencilIcon } from "lucide-react";

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

//tentar usar interface para pegar as clinicas do banco
interface SellerCardProps {
  seller: typeof sellersTable.$inferSelect;
}
const SellerCard = ({ seller }: SellerCardProps) => {
  const sellerInitials = seller.name
    .split(" ")
    .map((name) => name[0])
    .join("");

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
        <Badge variant="outline">
          <CalendarIcon className="mr-1" />
          seguda a Sexta
        </Badge>
        <Badge variant="outline">
          <ClockIcon className="mr-1" />
          das 08:00 as 18:00
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-red-800 hover:bg-red-900">
              <PencilIcon className="mr-1" />
              Ver mais
            </Button>
          </DialogTrigger>
          <UpsertSellerForm />
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default SellerCard;

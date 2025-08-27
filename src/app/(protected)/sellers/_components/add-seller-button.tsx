"use client";

import { DialogTrigger } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

import UpsertSellerForm from "./upsert-seller-form";

const AddSellerButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-emerald-600 hover:bg-emerald-900 sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Novo Vendedor</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </DialogTrigger>
      <UpsertSellerForm isOpen={isOpen} onSuccess={() => setIsOpen(false)} />
    </Dialog>
  );
};

export default AddSellerButton;

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
        <Button>
          <Plus />
          Novo Vendedor
        </Button>
      </DialogTrigger>
      <UpsertSellerForm onSuccess={() => setIsOpen(false)} />
    </Dialog>
  );
};

export default AddSellerButton;

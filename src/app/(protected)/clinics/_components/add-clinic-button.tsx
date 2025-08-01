"use client";

import { DialogTrigger } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

import UpsertClinicForm from "./upsert-clinic-form";

const AddClinicButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-900">
          <Plus />
          Adicionar Unidade
        </Button>
      </DialogTrigger>
      <UpsertClinicForm onSuccess={() => setIsOpen(false)} />
    </Dialog>
  );
};

export default AddClinicButton;

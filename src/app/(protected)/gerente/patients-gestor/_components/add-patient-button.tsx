"use client";

import { DialogTrigger } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

import UpsertPatientForm from "./upsert-patient-form";

interface Seller {
  id: string;
  name: string;
  email: string;
}

interface AddPatientButtonProps {
  sellerId: string;
  clinicId: string;
  sellers: Seller[];
}

const AddPatientButton = ({
  sellerId,
  clinicId,
  sellers,
}: AddPatientButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-900">
          <Plus />
          Adicionar
        </Button>
      </DialogTrigger>
      <UpsertPatientForm
        isOpen={isOpen}
        onSuccess={() => setIsOpen(false)}
        sellerId={sellerId}
        clinicId={clinicId}
        sellers={sellers}
      />
    </Dialog>
  );
};

export default AddPatientButton;

"use client";

import { DialogTrigger } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useState } from "react";

import UpsertPatientForm from "@/app/(protected)/vendedor/patients-seller/_components/upsert-patient-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface AddPatientButtonProps {
  sellerId: string;
  clinicId: string;
}

const AddPatientButton = ({ sellerId, clinicId }: AddPatientButtonProps) => {
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
      />
    </Dialog>
  );
};

export default AddPatientButton;

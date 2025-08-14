"use client";

import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Clinic {
  id: string;
  name: string;
}

interface SelectClinicVendedoresProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  onFirstClinicLoaded?: (clinicId: string) => void;
}

export default function SelectClinicVendedores({
  value,
  onValueChange,
  placeholder = "Selecione uma unidade",
  onFirstClinicLoaded,
}: SelectClinicVendedoresProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await fetch("/api/clinics");
        if (response.ok) {
          const clinicsData = await response.json();
          setClinics(clinicsData);

          // Se não há valor selecionado e há clínicas disponíveis, procura "Salgueiro" primeiro
          if (!value && clinicsData.length > 0 && onFirstClinicLoaded) {
            // Procurar pela clínica "Salgueiro" primeiro
            const salgueiroClinic = clinicsData.find((clinic: Clinic) =>
              clinic.name.toLowerCase().includes("salgueiro"),
            );

            if (salgueiroClinic) {
              onFirstClinicLoaded(salgueiroClinic.id);
            } else {
              // Se não encontrou Salgueiro, seleciona a primeira
              onFirstClinicLoaded(clinicsData[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar clínicas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinics();
  }, [value, onFirstClinicLoaded]);

  return (
    <div className="w-full">
      <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={isLoading ? "Carregando..." : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          {clinics.map((clinic) => (
            <SelectItem key={clinic.id} value={clinic.id}>
              {clinic.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

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

interface SelectClinicProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

export default function SelectClinic({
  value,
  onValueChange,
  placeholder = "Selecione uma unidade",
}: SelectClinicProps) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await fetch("/api/clinics");
        if (response.ok) {
          const clinicsData = await response.json();
          setClinics(clinicsData);
        }
      } catch (error) {
        console.error("Erro ao carregar clínicas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinics();
  }, []);

  return (
    <div className="w-full">
      <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={isLoading ? "Carregando..." : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as unidades</SelectItem>
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

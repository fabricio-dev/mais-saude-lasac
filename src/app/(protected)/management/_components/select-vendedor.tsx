"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Vendedor {
  id: string;
  name: string;
}

interface SelectVendedorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  clinicId?: string;
}

const SelectVendedor = ({
  value,
  onValueChange,
  placeholder = "Selecione um vendedor",
  clinicId,
}: SelectVendedorProps) => {
  const [open, setOpen] = useState(false);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendedores = async () => {
      if (!clinicId) {
        setVendedores([{ id: "all", name: "Todos os vendedores" }]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/sellers?clinicId=${clinicId}`);
        if (response.ok) {
          const data = await response.json();
          setVendedores([
            { id: "all", name: "Todos os vendedores" },
            ...data.map((seller: { id: string; name: string }) => ({
              id: seller.id,
              name: seller.name,
            })),
          ]);
        }
      } catch (error) {
        console.error("Erro ao buscar vendedores:", error);
        setVendedores([{ id: "all", name: "Todos os vendedores" }]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendedores();
  }, [clinicId]);

  const selectedVendedor = vendedores.find((vendedor) => vendedor.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {loading
            ? "Carregando..."
            : selectedVendedor
              ? selectedVendedor.name
              : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar vendedor..." />
          <CommandList>
            <CommandEmpty>Nenhum vendedor encontrado.</CommandEmpty>
            <CommandGroup>
              {vendedores.map((vendedor) => (
                <CommandItem
                  key={vendedor.id}
                  value={vendedor.id}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === vendedor.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {vendedor.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SelectVendedor;

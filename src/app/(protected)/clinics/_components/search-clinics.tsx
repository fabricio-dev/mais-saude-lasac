"use client";

import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SearchClinics = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );

  const handleSearch = (term: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (term.trim()) {
        params.set("search", term.trim());
      } else {
        params.delete("search");
      }
      router.push(`/clinics?${params.toString()}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchTerm);
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    // Pesquisa em tempo real com debounce
    if (value.trim() === "") {
      handleSearch("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Pesquisar por nome da unidade..."
        value={searchTerm}
        onChange={(e) => handleInputChange(e.target.value)}
        disabled={isPending}
        className="flex-1"
      />
      <Button type="submit" variant="outline" disabled={isPending}>
        <SearchIcon className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default SearchClinics;

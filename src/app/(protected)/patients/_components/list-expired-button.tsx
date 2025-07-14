"use client";

import { CalendarX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const ListExpiredButton = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isShowingExpired = searchParams.get("filter") === "expired";

  const handleToggleExpired = () => {
    const params = new URLSearchParams(searchParams);

    if (isShowingExpired) {
      params.delete("filter");
    } else {
      params.set("filter", "expired");
    }

    router.push(`/patients?${params.toString()}`);
  };

  return (
    <Button
      onClick={handleToggleExpired}
      variant={isShowingExpired ? "default" : "outline"}
      className={
        isShowingExpired
          ? "bg-red-600 text-white hover:bg-red-700"
          : "border-red-300 text-red-600 hover:bg-red-50"
      }
    >
      <CalendarX className="h-4 w-4" />
      {isShowingExpired ? "Todos" : "Vencidos"}
    </Button>
  );
};

export default ListExpiredButton;

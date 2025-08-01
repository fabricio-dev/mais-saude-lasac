"use client";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <Button
      onClick={() => {
        redirect("/authentication");
      }}
    >
      Entrar
    </Button>
  );
}

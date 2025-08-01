"use client";

import { createContext, ReactNode, useContext, useState } from "react";

interface PercentageContextType {
  percentage: number;
  setPercentage: (percentage: number) => void;
}

const PercentageContext = createContext<PercentageContextType | undefined>(
  undefined,
);

export function PercentageProvider({ children }: { children: ReactNode }) {
  const [percentage, setPercentage] = useState(10); // Valor padrão de 10%

  return (
    <PercentageContext.Provider value={{ percentage, setPercentage }}>
      {children}
    </PercentageContext.Provider>
  );
}

export function usePercentage() {
  const context = useContext(PercentageContext);
  if (context === undefined) {
    throw new Error("usePercentage must be used within a PercentageProvider");
  }
  return context;
}

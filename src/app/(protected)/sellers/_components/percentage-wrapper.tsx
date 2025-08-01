"use client";

import { toast } from "sonner";

import { usePercentage } from "@/contexts/percentage-context";

import AddPercentage from "./add-percentage";

const PercentageWrapper = () => {
  const { percentage, setPercentage } = usePercentage();

  const handleSubmit = (data: { percentage: string }) => {
    const percentageValue = Number(data.percentage);
    setPercentage(percentageValue);
    toast.success(`Percentual ${data.percentage}% aplicado com sucesso!`);
  };

  return (
    <AddPercentage
      onSubmit={handleSubmit}
      isLoading={false}
      currentPercentage={percentage}
    />
  );
};

export default PercentageWrapper;

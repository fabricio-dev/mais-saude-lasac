"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DatePicker } from "./date-picker";
import SelectClinic from "./select-clinic";

const RelatorioVendedores = () => {
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-full sm:w-[300px]">
            <SelectClinic placeholder="Selecione uma unidade" />
          </div>
          <div className="w-full sm:w-auto">
            <DatePicker />
          </div>
        </div>
      </div>

      {/* Placeholder para relatório de vendedores */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                Relatório de Vendedores
              </h3>
              <p className="text-gray-500">
                Esta seção será implementada conforme suas especificações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioVendedores;

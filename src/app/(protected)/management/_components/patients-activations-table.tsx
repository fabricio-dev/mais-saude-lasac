"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

dayjs.extend(utc);
dayjs.extend(timezone);

interface PatientActivation {
  id: string;
  name: string;
  activeAt: Date | null;
  reactivatedAt: Date | null;
  expirationDate: Date | null;
  sellerName: string | null;
  clinicName: string | null;
}

interface PatientsActivationsTableProps {
  data: PatientActivation[];
  isLoading?: boolean;
}

const PatientsActivationsTable = ({
  data,
  isLoading = false,
}: PatientsActivationsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calcular paginação
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // Resetar para página 1 quando os dados mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white">
        <div className="p-6">
          <div className="mb-4 h-6 w-64 animate-pulse rounded bg-gray-200" />
          <div className="space-y-3">
            {/* Table Header Skeleton */}
            <div className="flex space-x-4 border-b pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-32 animate-pulse rounded bg-gray-200"
                />
              ))}
            </div>
            {/* Table Rows Skeleton */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-4 w-32 animate-pulse rounded bg-gray-200"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Convênios Ativados/Reativados no Período
        </h3>
        <p className="text-center text-sm text-gray-500">
          Nenhum convênio foi ativado ou reativado neste período.
        </p>
      </div>
    );
  }

  // Formatar data de UTC para horário local
  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return dayjs(date).utc().tz("America/Sao_Paulo").format("DD/MM/YYYY");
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="rounded-lg border bg-white">
      <div className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Convênios Ativados/Reativados no Período
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Paciente</TableHead>
                <TableHead>Data de Ativação</TableHead>
                <TableHead>Data de Renovação</TableHead>
                <TableHead>Data de Vencimento</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Unidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((patient, index) => (
                <TableRow
                  key={patient.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}
                >
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{formatDate(patient.activeAt)}</TableCell>
                  <TableCell>{formatDate(patient.reactivatedAt)}</TableCell>
                  <TableCell>{formatDate(patient.expirationDate)}</TableCell>
                  <TableCell>{patient.sellerName || "-"}</TableCell>
                  <TableCell>{patient.clinicName || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de{" "}
            {totalItems} convênio{totalItems !== 1 ? "s" : ""}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientsActivationsTable;

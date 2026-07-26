"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  CardType,
  cardTypeLabels,
  formatCurrency,
  Operation,
  operationLabels,
} from "./constants";

export interface CardPriceHistoryEntry {
  id: string;
  operation: Operation;
  cardType: CardType;
  previousAmountInCents: number | null;
  newAmountInCents: number;
  createdAt: Date;
  changedBy: { name: string } | null;
}

// "all" = histórico completo de todas as operações; null = dialog fechado
export type PriceHistoryView =
  | { operation: Operation; cardType: CardType }
  | "all"
  | null;

interface PriceHistoryDialogProps {
  view: PriceHistoryView;
  history: CardPriceHistoryEntry[];
  onClose: () => void;
}

const PriceHistoryDialog = ({
  view,
  history,
  onClose,
}: PriceHistoryDialogProps) => {
  const isAll = view === "all";

  const filteredHistory =
    view === null
      ? []
      : isAll
        ? history
        : history.filter(
            (entry) =>
              entry.operation === view.operation &&
              entry.cardType === view.cardType,
          );

  const title = isAll
    ? "Histórico Completo de Preços"
    : view
      ? `Histórico — ${operationLabels[view.operation]} ${cardTypeLabels[view.cardType]}`
      : "";

  return (
    <Dialog
      open={!!view}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-amber-950">{title}</DialogTitle>
          <DialogDescription className="text-amber-800">
            {isAll
              ? "Todas as alterações de preço, da mais recente para a mais antiga."
              : "Alterações de preço desta combinação, da mais recente para a mais antiga."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
          {filteredHistory.map((entry) => (
            <div key={entry.id} className="rounded-md border p-3 text-sm">
              {isAll && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium text-amber-950">
                    {operationLabels[entry.operation]}
                  </span>
                  <Badge
                    variant={
                      entry.cardType === "enterprise" ? "default" : "secondary"
                    }
                  >
                    {cardTypeLabels[entry.cardType]}
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {entry.previousAmountInCents === null ? (
                    <>
                      Preço definido:{" "}
                      <span className="text-green-700">
                        {formatCurrency(entry.newAmountInCents)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-500 line-through">
                        {formatCurrency(entry.previousAmountInCents)}
                      </span>{" "}
                      →{" "}
                      <span className="text-green-700">
                        {formatCurrency(entry.newAmountInCents)}
                      </span>
                    </>
                  )}
                </span>
                <span className="text-gray-500">
                  {new Date(entry.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {entry.changedBy && (
                <div className="mt-1 text-xs text-gray-500">
                  Alterado por {entry.changedBy.name}
                </div>
              )}
            </div>
          ))}
          {filteredHistory.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">
              {isAll
                ? "Nenhuma alteração de preço registrada."
                : "Nenhuma alteração registrada para esta combinação."}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceHistoryDialog;

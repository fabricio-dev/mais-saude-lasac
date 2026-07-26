"use client";

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

interface PriceHistoryDialogProps {
  combination: {
    operation: Operation;
    cardType: CardType;
  } | null;
  history: CardPriceHistoryEntry[];
  onClose: () => void;
}

const PriceHistoryDialog = ({
  combination,
  history,
  onClose,
}: PriceHistoryDialogProps) => {
  const filteredHistory = combination
    ? history.filter(
        (entry) =>
          entry.operation === combination.operation &&
          entry.cardType === combination.cardType,
      )
    : [];

  return (
    <Dialog
      open={!!combination}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-amber-950">
            {combination
              ? `Histórico — ${operationLabels[combination.operation]} ${cardTypeLabels[combination.cardType]}`
              : ""}
          </DialogTitle>
          <DialogDescription className="text-amber-800">
            Alterações de preço desta combinação, da mais recente para a mais
            antiga.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
          {filteredHistory.map((entry) => (
            <div key={entry.id} className="rounded-md border p-3 text-sm">
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
              Nenhuma alteração registrada para esta combinação.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceHistoryDialog;

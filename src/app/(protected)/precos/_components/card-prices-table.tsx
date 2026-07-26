"use client";

import { Edit2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";

import { upsertCardPrice } from "@/actions/upsert-card-price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  CardType,
  cardTypeLabels,
  formatCurrency,
  Operation,
  operationLabels,
} from "./constants";
import PriceHistoryDialog, {
  CardPriceHistoryEntry,
} from "./price-history-dialog";

interface CardPrice {
  id: string;
  operation: Operation;
  cardType: CardType;
  amountInCents: number;
  updatedAt: Date | null;
}

interface CardPricesTableProps {
  cardPrices: CardPrice[];
  priceHistory: CardPriceHistoryEntry[];
}

// As 4 combinações possíveis de preço
const priceCombinations: {
  operation: Operation;
  cardType: CardType;
}[] = [
  { operation: "activation", cardType: "personal" },
  { operation: "activation", cardType: "enterprise" },
  { operation: "renewal", cardType: "personal" },
  { operation: "renewal", cardType: "enterprise" },
];

const CardPricesTable = ({
  cardPrices,
  priceHistory,
}: CardPricesTableProps) => {
  const [editingCombination, setEditingCombination] = useState<{
    operation: Operation;
    cardType: CardType;
  } | null>(null);
  const [historyCombination, setHistoryCombination] = useState<{
    operation: Operation;
    cardType: CardType;
  } | null>(null);
  const [amountInReais, setAmountInReais] = useState<number | undefined>(
    undefined,
  );

  const upsertCardPriceAction = useAction(upsertCardPrice, {
    onSuccess: () => {
      toast.success("Preço salvo com sucesso");
      setEditingCombination(null);
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao salvar preço");
    },
  });

  const findPrice = (operation: Operation, cardType: CardType) => {
    return cardPrices.find(
      (price) => price.operation === operation && price.cardType === cardType,
    );
  };

  const handleOpenEdit = (operation: Operation, cardType: CardType) => {
    const existingPrice = findPrice(operation, cardType);
    setAmountInReais(
      existingPrice ? existingPrice.amountInCents / 100 : undefined,
    );
    setEditingCombination({ operation, cardType });
  };

  const handleSave = () => {
    if (!editingCombination || !amountInReais || amountInReais <= 0) {
      toast.error("Informe um valor maior que zero");
      return;
    }

    upsertCardPriceAction.execute({
      operation: editingCombination.operation,
      cardType: editingCombination.cardType,
      amountInCents: Math.round(amountInReais * 100),
    });
  };

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operação</TableHead>
            <TableHead>Tipo de Cartão</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Última Atualização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {priceCombinations.map(({ operation, cardType }) => {
            const price = findPrice(operation, cardType);
            return (
              <TableRow key={`${operation}-${cardType}`}>
                <TableCell className="font-medium">
                  <button
                    type="button"
                    onClick={() =>
                      setHistoryCombination({ operation, cardType })
                    }
                    className="cursor-pointer underline-offset-4 hover:text-amber-800 hover:underline"
                    title="Ver histórico de preços"
                  >
                    {operationLabels[operation]}
                  </button>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      cardType === "enterprise" ? "default" : "secondary"
                    }
                  >
                    {cardTypeLabels[cardType]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {price ? (
                    <span className="font-medium text-green-700">
                      {formatCurrency(price.amountInCents)}
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-amber-700">
                      Não configurado
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {price?.updatedAt
                    ? new Date(price.updatedAt).toLocaleDateString("pt-BR")
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(operation, cardType)}
                  >
                    <Edit2 className="mr-1 h-4 w-4" />
                    {price ? "Editar" : "Definir"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog
        open={!!editingCombination}
        onOpenChange={(open) => {
          if (!open) setEditingCombination(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-950">
              {editingCombination
                ? `${operationLabels[editingCombination.operation]} — ${cardTypeLabels[editingCombination.cardType]}`
                : ""}
            </DialogTitle>
            <DialogDescription className="text-amber-800">
              Defina o valor cobrado para esta combinação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Valor</Label>
            <NumericFormat
              customInput={Input}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              placeholder="R$ 0,00"
              value={amountInReais ?? ""}
              onValueChange={(values) => {
                setAmountInReais(values.floatValue);
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingCombination(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={upsertCardPriceAction.status === "executing"}
            >
              {upsertCardPriceAction.status === "executing"
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PriceHistoryDialog
        combination={historyCombination}
        history={priceHistory}
        onClose={() => setHistoryCombination(null)}
      />
    </div>
  );
};

export default CardPricesTable;

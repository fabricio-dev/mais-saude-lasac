import { TrophyIcon, UsersIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface TopSellersProps {
  sellers: {
    id: string;
    name: string;
    email: string;
    avatarImageUrl: string | null;
    clinic: string;
    convenios: number;
    conveniosRenovados: number;
  }[];
  currentSellerEmail?: string;
}

export default function TopSellers({
  sellers,
  currentSellerEmail,
}: TopSellersProps) {
  return (
    <Card className="mx-auto w-full">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UsersIcon className="text-muted-foreground h-6 w-6" />
            <CardTitle className="text-base">Top 7 Vendedores</CardTitle>
          </div>
        </div>

        {/* Sellers List */}
        <div className="space-y-3">
          {sellers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                Nenhum vendedor encontrado no período selecionado
              </p>
            </div>
          ) : (
            sellers.map((seller, index) => {
              const isCurrentSeller = seller.email === currentSellerEmail;
              return (
                <div
                  key={seller.id}
                  className={`flex items-center justify-between rounded-lg p-3 transition-colors ${
                    isCurrentSeller
                      ? "bg-blue-50 shadow-sm"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isCurrentSeller
                            ? "bg-gray-100 text-gray-600"
                            : index < 3
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {index < 3 ? (
                          <TrophyIcon className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          className={`text-sm font-medium ${
                            isCurrentSeller
                              ? "bg-orange-600/30 text-red-800"
                              : "bg-gray-100 text-red-800"
                          }`}
                        >
                          {seller.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <h3
                        className={`text-sm ${isCurrentSeller ? "font-semibold text-red-900" : ""}`}
                      >
                        {seller.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {seller.clinic}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${
                        isCurrentSeller
                          ? "text-red-700"
                          : "text-muted-foreground"
                      }`}
                    >
                      novo: {seller.convenios} renov:{" "}
                      {seller.conveniosRenovados}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

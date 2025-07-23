import { UsersIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface TopSellersProps {
  sellers: {
    id: string;
    name: string;
    avatarImageUrl: string | null;
    clinic: string;
    convenios: number;
  }[];
}

export default function TopSellers({ sellers }: TopSellersProps) {
  return (
    <Card className="mx-auto w-full">
      <CardContent>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UsersIcon className="text-muted-foreground" />
            <CardTitle className="text-base">Vendedores</CardTitle>
          </div>
        </div>

        {/* Sellers List */}
        <div className="space-y-6">
          {sellers.map((seller) => (
            <div key={seller.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gray-100 text-sm font-medium text-gray-600">
                    {seller.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm">{seller.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {seller.clinic}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground text-sm font-medium">
                  {seller.convenios} conv.
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

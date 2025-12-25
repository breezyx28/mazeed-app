import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Edit, MoreVertical, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function SellerProducts() {
  const { sellerProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ["seller-products", sellerProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("seller_id", sellerProfile?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!sellerProfile?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container p-4 pb-24 mx-auto space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("products")}</h1>
        <Button onClick={() => navigate("/seller/products/new")} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          {t("addNewProduct")}
        </Button>
      </div>

      <div className="grid gap-4">
        {products?.map((product) => (
          <div
            key={product.id}
            className="bg-card p-4 rounded-xl border shadow-sm flex gap-4"
          >
            <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold truncate pr-2">
                    {product.name}
                  </h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    {product.stock_quantity} {t("inStockLabel")}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => navigate(`/seller/products/${product.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash className="w-4 h-4 mr-2" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="font-bold">
                  {product.price.toLocaleString()} SDG
                </span>
                <Badge
                  variant={
                    product.status === "published" ? "default" : "secondary"
                  }
                >
                  {product.status === "published" ? t("published") : t("draft")}
                </Badge>
              </div>
            </div>
          </div>
        ))}

        {products?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("noProductsYet")}</p>
            <Button
              variant="link"
              onClick={() => navigate("/seller/products/new")}
            >
              {t("createFirstProduct")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

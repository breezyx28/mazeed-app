import { Outlet, Navigate } from "react-router-dom";
import { SellerBottomNav } from "@/components/seller/SellerBottomNav";
import { useAuth } from "@/context/AuthContext";

export default function SellerLayout() {
  const { isAuthenticated, sellerProfile, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // If not a seller or not active, redirect to profile (where they see status)
  // EXCEPT if they are pending, we might want to let them see a "Pending" dashboard?
  // Requirements said: "Sellers can manage only products where product.seller_id = seller.id ... products hidden until seller status = active".
  // Let's allow access but maybe show restricted view in components if needed. 
  // For now verify is_seller is true.
  if (!sellerProfile) {
     return <Navigate to="/profile" />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <SellerBottomNav />
    </div>
  );
}

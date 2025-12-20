import { supabase } from "./supabase";

export async function createSellerProfile(payload: {
  shop_name: string;
  shop_slug?: string;
  description?: string;
  location?: Record<string, any>;
  opening_times?: Record<string, any>;
  website?: string;
  logo_url?: string;
}) {
  const { data, error } = await supabase.rpc("rpc_create_seller_profile", {
    shop_name: payload.shop_name,
    shop_slug: payload.shop_slug || null,
    description: payload.description || null,
    location: payload.location || null,
    opening_times: payload.opening_times || null,
    website: payload.website || null,
    logo_url: payload.logo_url || null,
  });
  return { data, error };
}

export async function updateSellerProfile(
  payload: Partial<{
    shop_name: string;
    shop_slug: string;
    description: string;
    location: Record<string, any>;
    opening_times: Record<string, any>;
    website: string;
    logo_url: string;
    social_media: any;
    cover_url: string;
  }>
) {
  const { data, error } = await supabase.rpc(
    "rpc_update_seller_profile",
    payload as any
  );
  return { data, error };
}

export async function getSellerStorefront(slug: string) {
  const { data, error } = await supabase.rpc("rpc_get_seller_storefront", {
    p_slug: slug,
  });
  return { data, error };
}

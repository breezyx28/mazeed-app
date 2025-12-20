
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  shop_name: z.string().min(3, "Shop name must be at least 3 characters").max(50),
  description: z.string().min(10, "Description must be at least 10 characters"),
  business_address: z.string().min(5, "Address is required"),
  website: z.string().url().optional().or(z.literal("")),
});

export default function SellerOnboarding() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shop_name: "",
      description: "",
      business_address: "",
      website: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !profile) return;
    setIsSubmitting(true);

    try {
      // 1. Generate slug from shop name
      const slug = values.shop_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      // 2. Call RPC to create seller
      // The RPC handles: check duplicates, insert seller, update profile.is_seller, set status='pending'
      const { error } = await supabase.rpc('rpc_create_seller_profile', {
        shop_name: values.shop_name,
        shop_slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
        description: values.description,
        location: { address: values.business_address },
        website: values.website || null
      });

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: t('success'),
        description: t('applicationSubmitted'),
      });
      
      navigate("/profile");
      
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: t('failure'),
        description: error.message || t('signupError'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-lg py-12 px-4 mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">{t('becomeASellerTitle')}</h1>
        <p className="text-muted-foreground">
          {t('becomeASellerSubtitle')}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="shop_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('shopName')}</FormLabel>
                <FormControl>
                  <Input placeholder="My Awesome Store" {...field} />
                </FormControl>
                <FormDescription>
                  {t('shopNameDescription')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('shopDescription')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('shopDescriptionPlaceholder')}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="business_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('businessAddress')}</FormLabel>
                <FormControl>
                  <Input placeholder="123 Market St, City..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

           <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('website')}</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? t('submitting') : t('submitApplication')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={() => navigate(-1)}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

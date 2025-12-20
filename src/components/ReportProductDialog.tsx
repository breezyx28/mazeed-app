import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";

interface ReportProductDialogProps {
  productId: string;
  sellerId: string;
  userId: string;
  userName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const REPORT_STATUSES = [
  { id: 'out_of_stock', labelKey: 'reportOutofStock' },
  { id: 'discontinued', labelKey: 'reportDiscontinued' },
  { id: 'temporarily_unavailable', labelKey: 'reportTemporarilyUnavailable' },
  { id: 'wrong_info', labelKey: 'reportWrongInfo' },
];

export function ReportProductDialog({ 
  productId, 
  sellerId, 
  userId, 
  userName,
  isOpen, 
  onOpenChange 
}: ReportProductDialogProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>("out_of_stock");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!status) return;

    setSubmitting(true);
    try {
      // 1. Check if user can report (rate limiting and duplicate check)
      const { data: canReport, error: checkError } = await supabase.rpc('can_report_product', {
        p_user_id: userId,
        p_product_id: productId
      });

      if (checkError) throw checkError;

      if (!canReport) {
        toast.error(t('reportAlreadyReported'));
        onOpenChange(false);
        return;
      }

      // 2. Submit report
      const { data: reportId, error: reportError } = await supabase.rpc('get_or_create_product_report', {
        p_product_id: productId,
        p_reporter_id: userId,
        p_reporter_name: userName || 'Customer',
        p_reported_status: status,
        p_report_reason: reason
      });

      if (reportError) throw reportError;

      toast.success(t('reportSuccess'));
      onOpenChange(false);
      // Reset form
      setReason("");
      setStatus("out_of_stock");
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error(t('reportError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Flag className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-center">
            {t('reportProduct')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('reportedStatusDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">{t('reportedStatus')}</Label>
            <RadioGroup 
              value={status} 
              onValueChange={setStatus} 
              className="grid grid-cols-1 gap-2"
            >
              {REPORT_STATUSES.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center space-x-3 space-x-reverse p-3 rounded-xl border transition-all cursor-pointer ${
                    status === item.id 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setStatus(item.id)}
                >
                  <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    status === item.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {status === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <Label 
                    htmlFor={item.id} 
                    className="flex-1 font-medium cursor-pointer"
                  >
                    {t(item.labelKey)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-semibold">
              {t('reportComment', 'Additional details')}
            </Label>
            <Textarea
              id="reason"
              placeholder={t('reportReasonPlaceholder')}
              className="min-h-[100px] rounded-xl resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-full"
            disabled={submitting}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white gap-2"
            disabled={submitting || !status}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Flag className="w-4 h-4" />
            )}
            {t('reportSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

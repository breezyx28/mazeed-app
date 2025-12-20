# Product Status Reporting System - Technical Specification

## 📋 Overview

A customer-initiated product status reporting system that allows customers to notify sellers about product availability issues (out of stock, discontinued, etc.) when they arrive at the store for pickup.

---

## 🎯 Business Requirements

### Problem Statement
Customers order products for in-store pickup, but upon arrival, discover the product is unavailable because the seller forgot to update the product status. This results in:
- Wasted customer time
- Poor customer experience
- Lost trust in the platform
- Inaccurate inventory data

### Solution
Enable customers to report product status issues directly from their orders, triggering notifications to sellers with actionable buttons (Confirm/Decline) on both mobile push notifications and in-app notifications.

---

## 📐 System Architecture

### 1. Database Schema

```sql
-- Product Status Reports Table
CREATE TABLE product_status_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  
  -- Reporter Information (NOT ANONYMOUS - Show customer name)
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_name text NOT NULL, -- Cached for display
  
  -- Report Details
  reported_status text NOT NULL, -- 'out_of_stock', 'discontinued', 'temporarily_unavailable', 'wrong_info'
  current_product_status text NOT NULL, -- Product status at time of report
  report_reason text, -- Optional customer comment
  report_count integer DEFAULT 1, -- Number of times this exact report was made
  
  -- Status & Lifecycle
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'expired', 'auto_updated')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  first_reported_at timestamptz DEFAULT now() NOT NULL, -- When first report was made
  last_reported_at timestamptz DEFAULT now() NOT NULL, -- When last duplicate report was made
  seller_response_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours') NOT NULL,
  auto_update_eligible_at timestamptz, -- When eligible for auto-update (12 hours after 5th report)
  
  -- Seller Response
  seller_response text, -- Optional seller comment when declining
  seller_dispute_evidence jsonb, -- Evidence if seller disputes
  
  -- Constraints
  UNIQUE(product_id, reported_status, status) WHERE status = 'pending'
);

-- Indexes for performance
CREATE INDEX idx_product_status_reports_product ON product_status_reports(product_id);
CREATE INDEX idx_product_status_reports_seller ON product_status_reports(seller_id);
CREATE INDEX idx_product_status_reports_status ON product_status_reports(status);
CREATE INDEX idx_product_status_reports_auto_update ON product_status_reports(auto_update_eligible_at) 
  WHERE status = 'pending' AND report_count >= 5;

-- Track individual reporters for a report
CREATE TABLE product_status_report_reporters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES product_status_reports(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(report_id, reporter_id)
);

-- Enhanced notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS 
  action_type text, -- 'product_status_report', 'product_unavailable_apology'
  action_data jsonb, -- {report_id, product_id, suggested_status, product_name, reporter_name}
  action_buttons jsonb, -- [{label, action, value, variant}]
  related_entity_type text, -- 'product_status_report'
  related_entity_id uuid; -- report_id

-- Track affected orders when product is confirmed unavailable
CREATE TABLE product_unavailability_impacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL REFERENCES product_status_reports(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Financial Impact
  original_order_total numeric NOT NULL,
  recalculated_order_total numeric NOT NULL,
  refund_amount numeric NOT NULL,
  
  -- Status
  customer_notified boolean DEFAULT false,
  item_removed boolean DEFAULT false,
  order_recalculated boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now() NOT NULL
);
```

### 2. Report Status Options

```typescript
const REPORTABLE_STATUSES = {
  out_of_stock: {
    label: 'Out of Stock',
    labelAr: 'نفذ من المخزون',
    productStatusUpdate: 'draft', // Hide from listings
    severity: 'high',
    description: 'Product is completely out of stock',
    descriptionAr: 'المنتج غير متوفر في المخزون'
  },
  temporarily_unavailable: {
    label: 'Temporarily Unavailable',
    labelAr: 'غير متوفر مؤقتاً',
    productStatusUpdate: 'draft',
    severity: 'medium',
    description: 'Product will be back in stock soon',
    descriptionAr: 'المنتج سيعود للمخزون قريباً'
  },
  discontinued: {
    label: 'Product Discontinued',
    labelAr: 'المنتج متوقف',
    productStatusUpdate: 'archived',
    severity: 'high',
    description: 'Product is no longer sold',
    descriptionAr: 'المنتج لم يعد متاحاً للبيع'
  },
  wrong_info: {
    label: 'Wrong Product Information',
    labelAr: 'معلومات المنتج خاطئة',
    productStatusUpdate: null, // No auto-update, just notification
    severity: 'low',
    description: 'Product details or images are incorrect',
    descriptionAr: 'تفاصيل أو صور المنتج غير صحيحة'
  }
};
```

---

## 🔄 Workflow & Business Logic

### Customer Report Flow

```
1. Customer Journey:
   ┌─────────────────────────────────────────────────┐
   │ 1. Customer orders product                      │
   │ 2. Goes to store for pickup                     │
   │ 3. Product unavailable                          │
   │ 4. Opens app → My Orders → Finds order          │
   │ 5. Clicks on unavailable product                │
   │ 6. Clicks "Report Issue" button                 │
   └─────────────────────────────────────────────────┘
                        ↓
   ┌─────────────────────────────────────────────────┐
   │ Report Modal:                                   │
   │ - Select status (Out of Stock, etc.)            │
   │ - Add optional comment                          │
   │ - WARNING: "This product will be removed        │
   │   from your cart and order"                     │
   │ - Confirm submission                            │
   └─────────────────────────────────────────────────┘
                        ↓
   ┌─────────────────────────────────────────────────┐
   │ System Actions:                                 │
   │ 1. Check for duplicate report (same product +   │
   │    same status + pending)                       │
   │                                                 │
   │ IF DUPLICATE EXISTS:                            │
   │   - Increment report_count                      │
   │   - Update last_reported_at                     │
   │   - Add reporter to reporters list              │
   │   - If count reaches 5, set auto_update_        │
   │     eligible_at to now() + 12 hours             │
   │                                                 │
   │ IF NEW REPORT:                                  │
   │   - Create new report (count = 1)               │
   │   - Add reporter to reporters list              │
   │                                                 │
   │ 2. Remove product from reporter's cart          │
   │ 3. Remove order_item from reporter's order      │
   │ 4. Recalculate order total                      │
   │ 5. Create impact record                         │
   │ 6. Notify seller (push + in-app)                │
   └─────────────────────────────────────────────────┘
```

### Seller Response Flow

```
Seller receives notification:
┌─────────────────────────────────────────────────┐
│ PUSH NOTIFICATION (Mobile):                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔔 Product Status Report                    │ │
│ │ Customer "Ahmed Ali" reports:               │ │
│ │ "Apple Watch 10" is OUT OF STOCK            │ │
│ │ (Reported 3 times)                          │ │
│ │                                             │ │
│ │ [Decline]  [Confirm & Update]               │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

IN-APP NOTIFICATION:
┌─────────────────────────────────────────────────┐
│ Notifications                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔔 Product Status Report                    │ │
│ │ Customer "Ahmed Ali" reports:               │ │
│ │ "Apple Watch 10" is OUT OF STOCK            │ │
│ │ Reported by 3 customers                     │ │
│ │                                             │ │
│ │ Current: Published → Suggested: Draft       │ │
│ │                                             │ │
│ │ [View Details] [Decline] [Confirm]          │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

Seller Actions:
┌─────────────────────────────────────────────────┐
│ IF CONFIRM:                                     │
│ 1. Update product status to suggested status   │
│ 2. Mark report as 'confirmed'                  │
│ 3. Find ALL pending orders with this product   │
│ 4. For each affected order:                    │
│    - Remove product from order                 │
│    - Recalculate order total                   │
│    - Create impact record                      │
│    - Send apology notification to customer     │
│ 5. Notify original reporter (success)          │
│                                                 │
│ IF DECLINE:                                     │
│ 1. Mark report as 'declined'                   │
│ 2. Optionally add seller comment/dispute       │
│ 3. Notify original reporter (declined)         │
│ 4. No product status change                    │
│ 5. No impact on other orders                   │
│                                                 │
│ IF IGNORE (24 hours):                           │
│ 1. Report auto-expires                         │
│ 2. Mark as 'expired'                           │
│ 3. No product status change                    │
└─────────────────────────────────────────────────┘
```

### Auto-Update Logic (5+ Reports, 12+ Hours)

```typescript
// Cron job runs every hour
async function checkAutoUpdateEligibility() {
  const eligibleReports = await supabase
    .from('product_status_reports')
    .select('*')
    .eq('status', 'pending')
    .gte('report_count', 5)
    .lte('auto_update_eligible_at', new Date())
    .is('auto_update_eligible_at', 'not', null);
    
  for (const report of eligibleReports) {
    // Auto-update product status
    await updateProductStatus(report.product_id, report.reported_status);
    
    // Mark report as auto-updated
    await supabase
      .from('product_status_reports')
      .update({ 
        status: 'auto_updated',
        seller_response_at: new Date()
      })
      .eq('id', report.id);
    
    // Handle all affected orders
    await handleProductUnavailability(report);
    
    // Notify seller of automatic update
    await notifySeller(report.seller_id, {
      type: 'auto_product_update',
      message: `Product "${report.product_name}" was automatically updated to ${report.reported_status} after 5+ reports and 12 hours without response.`
    });
  }
}
```

---

## 🔔 Notification System

### 1. Seller Notification (Product Reported)

```typescript
// Push Notification
{
  title: 'Product Status Report',
  body: `Customer "${reporterName}" reports: "${productName}" is ${statusLabel}`,
  data: {
    type: 'product_status_report',
    report_id: reportId,
    product_id: productId,
    action_required: true
  },
  actions: [
    { id: 'confirm', title: 'Confirm', icon: 'check' },
    { id: 'decline', title: 'Decline', icon: 'close' }
  ],
  category: 'PRODUCT_REPORT',
  priority: 'high'
}

// In-App Notification
{
  type: 'product_status_report',
  title: 'Product Status Report',
  message: `Customer "${reporterName}" reports: "${productName}" is ${statusLabel}`,
  metadata: {
    report_id: reportId,
    product_id: productId,
    product_name: productName,
    reporter_name: reporterName,
    reported_status: reportedStatus,
    report_count: reportCount,
    current_status: currentStatus,
    suggested_status: suggestedStatus
  },
  action_buttons: [
    { label: 'View Details', action: 'view', variant: 'ghost' },
    { label: 'Decline', action: 'decline', variant: 'outline' },
    { label: 'Confirm & Update', action: 'confirm', variant: 'default' }
  ],
  is_read: false,
  created_at: new Date()
}
```

### 2. Customer Apology Notification (Product Unavailable)

```typescript
// When seller confirms or auto-update happens
// Send to ALL customers with pending orders containing this product

// Push Notification
{
  title: 'Order Update - Product Unavailable',
  body: `We apologize, "${productName}" is no longer available. Your order has been updated.`,
  data: {
    type: 'product_unavailable_apology',
    order_id: orderId,
    product_id: productId
  },
  priority: 'high'
}

// In-App Notification
{
  type: 'product_unavailable_apology',
  title: 'Order Update - Product Unavailable',
  message: `We sincerely apologize. "${productName}" is no longer available and has been removed from your order.`,
  metadata: {
    order_id: orderId,
    product_id: productId,
    product_name: productName,
    original_total: originalTotal,
    new_total: newTotal,
    refund_amount: refundAmount
  },
  action_buttons: [
    { label: 'View Order', action: 'view_order', variant: 'default' },
    { label: 'Browse Alternatives', action: 'browse', variant: 'outline' }
  ],
  is_read: false,
  created_at: new Date()
}
```

### 3. Reporter Feedback Notification

```typescript
// When seller responds to report

// IF CONFIRMED:
{
  type: 'report_confirmed',
  title: 'Report Confirmed',
  message: `Thank you! The seller confirmed "${productName}" is ${statusLabel}. The product has been updated.`,
  metadata: {
    report_id: reportId,
    product_id: productId
  }
}

// IF DECLINED:
{
  type: 'report_declined',
  title: 'Report Declined',
  message: `The seller reviewed your report for "${productName}" and indicated the product is still available.`,
  metadata: {
    report_id: reportId,
    product_id: productId,
    seller_comment: sellerComment // Optional
  }
}
```

---

## 💰 Order Recalculation Logic

```typescript
async function handleProductUnavailability(report: ProductStatusReport) {
  // 1. Find all pending orders with this product
  const affectedOrders = await supabase
    .from('order_items')
    .select('*, orders(*)')
    .eq('product_id', report.product_id)
    .in('orders.status', ['pending', 'processing']);
    
  for (const orderItem of affectedOrders) {
    const order = orderItem.orders;
    
    // 2. Calculate original total
    const originalTotal = order.total_amount;
    
    // 3. Remove the order item
    await supabase
      .from('order_items')
      .delete()
      .eq('id', orderItem.id);
    
    // 4. Recalculate order total
    const remainingItems = await supabase
      .from('order_items')
      .select('price_at_purchase, quantity')
      .eq('order_id', order.id);
      
    const newTotal = remainingItems.reduce((sum, item) => 
      sum + (item.price_at_purchase * item.quantity), 0
    );
    
    // 5. Update order
    await supabase
      .from('orders')
      .update({ total_amount: newTotal })
      .eq('id', order.id);
    
    // 6. Create impact record
    await supabase
      .from('product_unavailability_impacts')
      .insert({
        report_id: report.id,
        order_id: order.id,
        order_item_id: orderItem.id,
        customer_id: order.user_id,
        original_order_total: originalTotal,
        recalculated_order_total: newTotal,
        refund_amount: originalTotal - newTotal,
        item_removed: true,
        order_recalculated: true
      });
    
    // 7. Notify customer
    await sendApologyNotification(order.user_id, {
      productName: report.product_name,
      orderId: order.id,
      originalTotal,
      newTotal,
      refundAmount: originalTotal - newTotal
    });
    
    // 8. Remove from cart if exists
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', order.user_id)
      .eq('product_id', report.product_id);
  }
}
```

---

## 🛡️ Abuse Prevention & Rate Limiting

```typescript
// Rate limiting rules
const RATE_LIMITS = {
  max_reports_per_day: 5, // Per customer
  max_reports_per_product_per_week: 1, // Same customer, same product
  min_time_between_reports: 300000, // 5 minutes (milliseconds)
};

async function validateReportSubmission(customerId: string, productId: string) {
  // Check daily limit
  const todayReports = await supabase
    .from('product_status_report_reporters')
    .select('count')
    .eq('reporter_id', customerId)
    .gte('reported_at', startOfDay(new Date()));
    
  if (todayReports.count >= RATE_LIMITS.max_reports_per_day) {
    throw new Error('Daily report limit reached');
  }
  
  // Check product-specific limit
  const weeklyProductReports = await supabase
    .from('product_status_report_reporters')
    .select('*, product_status_reports!inner(product_id)')
    .eq('reporter_id', customerId)
    .eq('product_status_reports.product_id', productId)
    .gte('reported_at', subDays(new Date(), 7));
    
  if (weeklyProductReports.length > 0) {
    throw new Error('You already reported this product this week');
  }
  
  // Check time between reports
  const lastReport = await supabase
    .from('product_status_report_reporters')
    .select('reported_at')
    .eq('reporter_id', customerId)
    .order('reported_at', { ascending: false })
    .limit(1)
    .single();
    
  if (lastReport && 
      Date.now() - new Date(lastReport.reported_at).getTime() < RATE_LIMITS.min_time_between_reports) {
    throw new Error('Please wait before submitting another report');
  }
  
  return true;
}
```

---

## 🎨 UI Components

### 1. Report Issue Button (Customer Order Details)

```typescript
// OrderItemCard.tsx
<Card>
  <CardHeader>
    <CardTitle>{product.name}</CardTitle>
    <CardDescription>Status: {orderItem.status}</CardDescription>
  </CardHeader>
  <CardContent>
    <img src={product.image} alt={product.name} />
    <p>Price: {orderItem.price_at_purchase} SDG</p>
    <p>Quantity: {orderItem.quantity}</p>
  </CardContent>
  <CardFooter>
    <Button 
      variant="outline" 
      onClick={() => setShowReportModal(true)}
      className="w-full"
    >
      <AlertTriangle className="mr-2 h-4 w-4" />
      Report Issue
    </Button>
  </CardFooter>
</Card>
```

### 2. Report Modal

```typescript
// ReportProductModal.tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Report Product Issue</DialogTitle>
      <DialogDescription>
        Help us keep our inventory accurate
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>What's the problem?</Label>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select issue type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(REPORTABLE_STATUSES).map(([key, status]) => (
              <SelectItem key={key} value={key}>
                {status.label} - {status.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Additional details (optional)</Label>
        <Textarea 
          placeholder="What did the store clerk say?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          After submitting this report, this product will be removed from your cart and order.
          Your order total will be recalculated.
        </AlertDescription>
      </Alert>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmitReport} disabled={!selectedStatus}>
        Submit Report
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3. Seller Notification Card

```typescript
// SellerNotificationCard.tsx
<Card className="border-l-4 border-l-orange-500">
  <CardHeader>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <div>
          <CardTitle>Product Status Report</CardTitle>
          <CardDescription>
            Customer "{notification.metadata.reporter_name}" reports:
          </CardDescription>
        </div>
      </div>
      <Badge variant="destructive">
        {notification.metadata.report_count} reports
      </Badge>
    </div>
  </CardHeader>
  
  <CardContent className="space-y-3">
    <div>
      <p className="font-semibold">{notification.metadata.product_name}</p>
      <p className="text-sm text-muted-foreground">
        Status: {notification.metadata.reported_status}
      </p>
    </div>
    
    <div className="flex items-center gap-2 text-sm">
      <span>Current: <Badge>{notification.metadata.current_status}</Badge></span>
      <ArrowRight className="h-4 w-4" />
      <span>Suggested: <Badge variant="outline">{notification.metadata.suggested_status}</Badge></span>
    </div>
    
    {notification.metadata.report_count >= 5 && (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          This product will auto-update in 12 hours if not responded to
        </AlertDescription>
      </Alert>
    )}
  </CardContent>
  
  <CardFooter className="flex gap-2">
    <Button 
      variant="outline" 
      onClick={() => handleViewDetails(notification)}
      className="flex-1"
    >
      View Details
    </Button>
    <Button 
      variant="outline" 
      onClick={() => handleDecline(notification)}
      className="flex-1"
    >
      Decline
    </Button>
    <Button 
      onClick={() => handleConfirm(notification)}
      className="flex-1"
    >
      Confirm & Update
    </Button>
  </CardFooter>
</Card>
```

---

## 📊 Analytics & Reporting

### Seller Dashboard Metrics

```typescript
interface ReportAnalytics {
  total_reports: number;
  pending_reports: number;
  confirmed_reports: number;
  declined_reports: number;
  auto_updated_reports: number;
  average_response_time_hours: number;
  most_reported_products: Array<{
    product_id: string;
    product_name: string;
    report_count: number;
    status: string;
  }>;
  report_accuracy_rate: number; // confirmed / (confirmed + declined)
}
```

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Database schema migration
- [ ] API endpoints for report submission
- [ ] API endpoints for seller response
- [ ] Basic notification system
- [ ] Order recalculation logic

### Phase 2: UI Components (Week 1-2)
- [ ] Report Issue button on order details
- [ ] Report submission modal
- [ ] Seller notification cards
- [ ] Customer apology notifications
- [ ] Report details view

### Phase 3: Advanced Features (Week 2)
- [ ] Duplicate report aggregation
- [ ] Rate limiting implementation
- [ ] Auto-update cron job (5 reports, 12 hours)
- [ ] Seller dispute system
- [ ] Analytics dashboard

### Phase 4: Push Notifications (Week 2-3)
- [ ] Push notification setup (FCM/APNS)
- [ ] Action buttons on push notifications
- [ ] Handle notification actions
- [ ] Background notification processing

### Phase 5: Testing & Refinement (Week 3)
- [ ] End-to-end testing
- [ ] Load testing (concurrent reports)
- [ ] Edge case handling
- [ ] Performance optimization

---

## 🔧 API Endpoints

```typescript
// Customer endpoints
POST   /api/products/:productId/report
GET    /api/products/:productId/reports/my-reports

// Seller endpoints
GET    /api/seller/reports
GET    /api/seller/reports/:reportId
POST   /api/seller/reports/:reportId/confirm
POST   /api/seller/reports/:reportId/decline
POST   /api/seller/reports/:reportId/dispute

// Admin endpoints
GET    /api/admin/reports
GET    /api/admin/reports/analytics
```

---

## ✅ Success Metrics

1. **Inventory Accuracy**: Increase from baseline to 90%+ within 3 months
2. **Customer Satisfaction**: Reduce "product unavailable" complaints by 60%
3. **Seller Response Time**: Average < 2 hours
4. **Report Accuracy**: > 80% confirmation rate
5. **System Adoption**: > 50% of affected customers use report feature

---

## 🎯 Key Decisions Summary

| Question | Decision |
|----------|----------|
| **Anonymous reports?** | NO - Show customer name to seller |
| **What happens to reporter's order?** | Product removed from cart & order, total recalculated |
| **What happens to other orders?** | All customers notified, product removed, orders recalculated |
| **Customer rewards?** | Not implemented yet (future feature) |
| **Auto-update threshold?** | 5 reports + 12 hours without response |
| **Duplicate reports?** | Aggregate into single report, increment count |
| **Seller disputes?** | Yes, sellers can dispute with evidence |

---

## 📝 Notes & Considerations

1. **Privacy**: Customer names are shown to sellers to build accountability
2. **Financial Impact**: System automatically handles refunds/recalculations
3. **Scalability**: Duplicate aggregation prevents database bloat
4. **Fairness**: 12-hour window gives sellers time to respond before auto-update
5. **Transparency**: All parties receive appropriate notifications
6. **Flexibility**: Sellers can dispute reports with evidence

---

## 🔮 Future Enhancements

1. **AI-Powered Validation**: Detect suspicious report patterns
2. **Customer Reputation System**: Track report accuracy per customer
3. **Seller Performance Metrics**: Track response times and accuracy
4. **Alternative Product Suggestions**: Suggest similar products when one is unavailable
5. **Predictive Analytics**: Predict stock issues before they happen
6. **Integration with POS**: Real-time inventory sync
7. **Customer Rewards**: Points for accurate reports
8. **Multi-language Support**: Full Arabic translation

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-19  
**Status**: Ready for Implementation

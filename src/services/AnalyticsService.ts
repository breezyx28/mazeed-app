import { supabase } from "@/lib/supabase";

export type InteractionType = 'view' | 'click' | 'purchase';

interface QueuedInteraction {
  userId: string;
  categoryId: string;
  type: InteractionType;
  timestamp: string;
}

const STORAGE_KEY = 'mazeed_analytics_queue';
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_QUEUE_SIZE = 50;

/**
 * AnalyticsService - Pro Batch & Sync Architecture.
 * Records interactions locally and flushes them to the server in batches.
 */
export class AnalyticsService {
  private static queue: QueuedInteraction[] = this.loadQueue();
  private static timer: any = null;
  private static isSyncing = false;

  /**
   * Initializes the service, sets up listeners and timers.
   */
  static init() {
    if (typeof window === 'undefined') return;

    // Set up standard periodic sync
    this.startTimer();

    // Sync when user leaves the page or app goes to background
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    // Special handling for mobile/native backgrounding if needed
    window.addEventListener('blur', () => this.flush());
  }

  private static loadQueue(): QueuedInteraction[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static saveQueue() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
  }

  private static startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.flush(), SYNC_INTERVAL);
  }

  /**
   * Records an interaction locally.
   */
  static trackCategoryInteraction(
    userId: string | undefined, 
    categoryId: string | undefined, 
    type: InteractionType
  ) {
    if (!userId || !categoryId) return;

    this.queue.push({
      userId,
      categoryId,
      type,
      timestamp: new Date().toISOString()
    });

    this.saveQueue();

    // If queue gets too large, flush immediately to prevent memory issues
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  /**
   * Sends all queued interactions to the server.
   */
  static async flush() {
    if (this.isSyncing || this.queue.length === 0) return;

    this.isSyncing = true;
    const interactionsToSync = [...this.queue];
    
    try {
      // Map queue to the format expected by the DB function
      const payload = interactionsToSync.map(i => ({
        p_user_id: i.userId,
        p_category_id: i.categoryId,
        p_interaction_type: i.type,
        p_timestamp: i.timestamp
      }));

      // Call the batch RPC function
      const { error } = await supabase.rpc('batch_increment_category_interactions', {
        p_interactions: payload
      });

      if (!error) {
        // Clear only the items we successfully attempted to sync
        this.queue = this.queue.filter(item => 
          !interactionsToSync.some(syncItem => 
            syncItem.timestamp === item.timestamp && syncItem.categoryId === item.categoryId
          )
        );
        this.saveQueue();
      } else if (import.meta.env.DEV) {
        console.error('[Analytics] Sync failed:', error.message);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Analytics] Critical sync failure:', err);
      }
    } finally {
      this.isSyncing = false;
    }
  }
}

// Auto-initialize on import in client context
if (typeof window !== 'undefined') {
  AnalyticsService.init();
}

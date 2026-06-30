import { supabase as client } from "./supabase-client";

export interface KeyPoolEntry {
  id: string;
  provider: string;
  keyLabel: string;
  keyValue: string;
  isActive: boolean;
  lastUsedAt: string;
  totalRequests: number;
  errorCount: number;
  createdAt: string;
}

export interface KeyPoolStats {
  [provider: string]: {
    total: number;
    active: number;
    totalRequests: number;
  };
}

/**
 * API Key Pool Manager — Round-Robin Load Balancing
 *
 * Users add multiple API keys per provider.
 * When a request comes in, the system picks the least-recently-used key.
 * This distributes load across all keys to avoid rate limits.
 */
export class KeyPoolManager {
  private supabase = client;

  /**
   * Add a new API key to the pool
   */
  async addKey(params: {
    provider: string;
    keyValue: string;
    label?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Detect provider from key prefix if not specified
    const provider = params.provider || this.detectProvider(params.keyValue);

    const { error } = await this.supabase.from("user_key_pool").insert({
      user_id: user.id,
      provider,
      key_value: params.keyValue,
      key_label: params.label || `${provider} key`,
      is_active: true,
      last_used_at: "2000-01-01T00:00:00Z", // Never used = first in round-robin
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /**
   * Get all keys for current user
   */
  async listKeys(): Promise<KeyPoolEntry[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from("user_key_pool")
      .select("*")
      .eq("user_id", user.id)
      .order("provider")
      .order("created_at");

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      provider: String(row.provider),
      keyLabel: String(row.key_label || ""),
      keyValue: this.maskKey(String(row.key_value)),
      isActive: Boolean(row.is_active),
      lastUsedAt: String(row.last_used_at),
      totalRequests: Number(row.total_requests || 0),
      errorCount: Number(row.error_count || 0),
      createdAt: String(row.created_at),
    }));
  }

  /**
   * Get stats per provider
   */
  async getStats(): Promise<KeyPoolStats> {
    const keys = await this.listKeys();
    const stats: KeyPoolStats = {};
    for (const key of keys) {
      if (!stats[key.provider]) {
        stats[key.provider] = { total: 0, active: 0, totalRequests: 0 };
      }
      stats[key.provider].total++;
      if (key.isActive) stats[key.provider].active++;
      stats[key.provider].totalRequests += key.totalRequests;
    }
    return stats;
  }

  /**
   * Toggle key active/inactive
   */
  async toggleKey(id: string): Promise<boolean> {
    const { data } = await this.supabase
      .from("user_key_pool")
      .select("is_active")
      .eq("id", id)
      .single();

    if (!data) return false;

    const { error } = await this.supabase
      .from("user_key_pool")
      .update({ is_active: !data.is_active })
      .eq("id", id);

    return !error;
  }

  /**
   * Delete a key from pool
   */
  async deleteKey(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("user_key_pool")
      .delete()
      .eq("id", id);
    return !error;
  }

  /**
   * Get the next available key for round-robin (client-side fallback)
   * Uses least-recently-used strategy
   */
  async getNextKey(
    provider: string,
    userId?: string
  ): Promise<string | null> {
    const uid =
      userId || (await this.supabase.auth.getUser()).data.user?.id;
    if (!uid) return null;

    // Use the DB function for atomic select+update
    const { data, error } = await this.supabase.rpc("get_next_api_key", {
      p_user_id: uid,
      p_provider: provider,
    });

    if (error || !data || data.length === 0) return null;
    return data[0].key_val;
  }

  /**
   * Report an error for a key (for tracking reliability)
   */
  async reportError(keyId: string): Promise<void> {
    await this.supabase.rpc("increment_error_count", { p_id: keyId });
  }

  /**
   * Detect provider from key prefix
   */
  private detectProvider(key: string): string {
    if (key.startsWith("sk-or-")) return "openrouter";
    if (key.startsWith("sk-ant-")) return "anthropic";
    if (key.startsWith("gsk_")) return "groq";
    if (key.startsWith("AIza")) return "google";
    if (key.startsWith("nvapi-")) return "nvidia";
    if (key.startsWith("sk-")) return "openai";
    return "openai"; // default
  }

  /**
   * Mask key for display: sk-or-...XXXX
   */
  private maskKey(key: string): string {
    if (key.length <= 12) return key.slice(0, 4) + "...";
    return key.slice(0, 8) + "..." + key.slice(-4);
  }
}

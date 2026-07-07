import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Secure API Key Proxy Endpoint
 * 
 * This endpoint fetches the next available API key from the user's key pool
 * using round-robin load balancing. Keys are never exposed to the client.
 */
export async function POST(req: NextRequest) {
  try {
    const { provider } = await req.json();
    
    if (!provider || typeof provider !== "string") {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    // Get auth token from header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    
    // Create Supabase client with service role key for secure DB access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Use the round-robin RPC function to get the next available key
    const { data, error } = await supabase.rpc("get_next_api_key", {
      p_user_id: user.id,
      p_provider: provider,
    });

    if (error) {
      console.error("Failed to fetch API key:", error);
      return NextResponse.json(
        { error: "No API keys available for this provider" },
        { status: 404 }
      );
    }

    if (!data || data.length === 0 || !data[0].key_val) {
      return NextResponse.json(
        { error: `No active API keys found for ${provider}. Please add one in your dashboard.` },
        { status: 404 }
      );
    }

    // Return the key securely - it will be used server-side only
    return NextResponse.json({
      success: true,
      key: data[0].key_val,
      provider,
    });

  } catch (error) {
    console.error("API key proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MOVEPAYMENT_API_URL = "https://api.aws.movepayment.eu";

async function getApiKeyFromDb(): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return null;
  const res = await fetch(`${supabaseUrl}/rest/v1/site_settings?select=value&key=eq.movepayment_api_key&limit=1`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  const data = await res.json().catch(() => []);
  return data?.[0]?.value ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MOVEPAYMENT_API_KEY") ?? await getApiKeyFromDb();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Move Payment API-sleutel is niet geconfigureerd." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const {
      orderId,
      amount,
      moveId,
      method,
      payerName,
      languageCode = "nl",
      successUrl,
      cancelUrl,
    } = body;

    if (!orderId || amount === undefined || !moveId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "Ontbrekende verplichte velden (orderId, amount, moveId, successUrl, cancelUrl)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload: Record<string, unknown> = {
      orderId: String(orderId),
      amount: Number(amount),
      moveId: String(moveId),
      languageCode,
      successUrl,
      cancelUrl,
    };

    if (payerName) payload.payerName = payerName;
    if (method) payload.paymentMethod = method;

    const res = await fetch(`${MOVEPAYMENT_API_URL}/api/ecommerce/payment`, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Move Payment error:", res.status, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: data.message ?? data.error ?? `Move Payment fout (${res.status})` }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        redirect_url: data.redirect_url,
        token: data.token,
        transaction_id: data.transaction_id,
        expires_at: data.expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("movepayment edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Interne serverfout." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

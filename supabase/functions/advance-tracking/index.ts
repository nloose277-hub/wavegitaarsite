import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TRACKING_STEPS = ["ontvangen", "verwerkt", "voorbereid", "verzonden", "afgeleverd"];

const STEP_LABELS: Record<string, string> = {
  ontvangen: "Bestelling ontvangen",
  verwerkt: "Bestelling verwerkt",
  voorbereid: "Pakket voorbereid",
  verzonden: "Onderweg",
  afgeleverd: "Afgeleverd",
};

const FROM_EMAIL = "WaveGitaar <info@wavegitaar.nl>";

function formatPrice(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const parts = rounded.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `\u20AC ${intPart},${parts[1]}`;
}

async function sendTrackingUpdateEmail(
  email: string,
  firstName: string,
  orderNumber: string,
  trackingCode: string,
  newStatus: string,
  total: number,
): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY not configured");
    return;
  }

  const statusLabel = STEP_LABELS[newStatus] ?? newStatus;
  const isDelivered = newStatus === "afgeleverd";

  const html = `<!DOCTYPE html>
<html lang="nl"><body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table style="width:100%;max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <tr><td style="background:#1c1917;padding:28px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">WaveGitaar</h1>
      <p style="color:#a8a29e;margin:6px 0 0;font-size:14px;letter-spacing:0.5px;text-transform:uppercase;">Track &amp; Trace update</p>
    </td></tr>
    <tr><td style="padding:36px 40px 8px;">
      <h2 style="color:#1c1917;margin:0 0 10px;font-size:22px;font-weight:700;">Beste ${firstName},</h2>
      <p style="color:#555;font-size:16px;line-height:1.7;margin:0;">De status van je bestelling is bijgewerkt naar:<br/><strong style="color:#c2410c;font-size:18px;">${statusLabel}</strong></p>
    </td></tr>
    <tr><td style="padding:20px 40px;">
      <table style="width:100%;background:#f9f8f7;border-radius:12px;border:1px solid #eee;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Ordernummer</p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1c1917;">${orderNumber}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Track &amp; Trace code</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#c2410c;letter-spacing:1px;">${trackingCode}</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:8px 40px 28px;">
      <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">Je kunt je bestelling live volgen via de Track &amp; Trace pagina op onze website met je persoonlijke code.</p>
      ${isDelivered ? '<p style="margin:16px 0 0;font-size:15px;color:#555;line-height:1.7;">Je bestelling is afgeleverd. Veel speelplezier met je nieuwe gitaar!</p>' : ""}
    </td></tr>
    <tr><td style="background:#f5f5f4;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">WaveGitaar &middot; KvK 32137384 &middot; Eastein 18, 9136RD Peazens</p>
      <p style="margin:6px 0 0;font-size:12px;color:#bbb;">Deze e-mail is automatisch verzonden. Gelieve niet te reageren op dit bericht.</p>
    </td></tr>
  </table>
</body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: `Update: ${statusLabel} — ${orderNumber} — WaveGitaar`,
      html,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown");
    console.error(`Resend error (${res.status}): ${errText}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("id, paid_at, status, customer_email, customer_first_name, order_number, tracking_code, total")
      .eq("payment_status", "paid")
      .not("paid_at", "is", null)
      .not("status", "eq", "geannuleerd")
      .not("status", "eq", "afgeleverd");

    if (fetchError) throw fetchError;

    let updated = 0;
    let emailsSent = 0;
    const now = new Date();

    for (const order of orders ?? []) {
      if (!order.paid_at) continue;

      const hoursSincePaid = Math.floor(
        (now.getTime() - new Date(order.paid_at).getTime()) / (1000 * 60 * 60),
      );

      // Advance one step every 8 hours so the full 5-step timeline
      // completes within ~32 hours (fits the 1-3 werkdagen delivery window)
      const targetStepIndex = Math.min(
        Math.floor(hoursSincePaid / 8),
        TRACKING_STEPS.length - 1,
      );
      const targetStep = TRACKING_STEPS[targetStepIndex];

      if (order.status !== targetStep && targetStepIndex < TRACKING_STEPS.length) {
        const updates: Record<string, string> = {
          status: targetStep,
          payment_status: "paid",
        };

        const { error: updateError } = await supabase
          .from("orders")
          .update(updates)
          .eq("id", order.id);

        if (updateError) {
          console.error(`Failed to update order ${order.id}:`, updateError.message);
          continue;
        }

        updated++;

        if (order.customer_email) {
          await sendTrackingUpdateEmail(
            order.customer_email,
            order.customer_first_name?.trim() || "klant",
            order.order_number,
            order.tracking_code,
            targetStep,
            Number(order.total) || 0,
          );
          emailsSent++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        emailsSent,
        checked: orders?.length ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FROM_EMAIL = "WaveGitaar <info@wavegitaar.nl>";
const NOTIFY_EMAIL = "info@wavegitaar.nl";

function formatPrice(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const parts = rounded.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `\u20AC ${intPart},${parts[1]}`;
}

function buildCustomerEmail(order: {
  order_number: string;
  tracking_code: string;
  customer_first_name?: string | null;
  customer_email: string;
  items: { product_name: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address?: Record<string, unknown> | null;
}): string {
  const firstName = order.customer_first_name?.trim() || "klant";
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:15px;color:#333;">${item.product_name}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:15px;color:#666;">${item.quantity}x</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:15px;color:#333;font-weight:600;">${formatPrice(item.total)}</td>
    </tr>
  `).join("");

  const addr = order.shipping_address as Record<string, string> | null;
  const addrHtml = addr ? `
    <p style="margin:0;color:#555;font-size:15px;line-height:1.7;">
      ${addr.street || ""} ${addr.house_number || addr.housenumber || ""}${addr.addition ? " " + addr.addition : ""}<br/>
      ${addr.postal_code || addr.postalcode || ""} ${addr.city || ""}<br/>
      ${addr.country || "Nederland"}
    </p>
  ` : "";

  return `<!DOCTYPE html>
<html lang="nl"><body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table style="width:100%;max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <tr><td style="background:#1c1917;padding:28px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">WaveGitaar</h1>
      <p style="color:#a8a29e;margin:6px 0 0;font-size:14px;letter-spacing:0.5px;text-transform:uppercase;">Orderbevestiging</p>
    </td></tr>
    <tr><td style="padding:36px 40px 8px;">
      <h2 style="color:#1c1917;margin:0 0 10px;font-size:22px;font-weight:700;">Beste ${firstName},</h2>
      <p style="color:#555;font-size:16px;line-height:1.7;margin:0;">Bedankt voor je bestelling bij WaveGitaar. We hebben je betaling ontvangen en je bestelling is in behandeling genomen. Hieronder vind je een overzicht van je aankoop en je persoonlijke track &amp; trace code.</p>
    </td></tr>
    <tr><td style="padding:20px 40px;">
      <table style="width:100%;background:#f9f8f7;border-radius:12px;border:1px solid #eee;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Ordernummer</p>
          <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1c1917;">${order.order_number}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Track &amp; Trace code</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#c2410c;letter-spacing:1px;">${order.tracking_code}</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:8px 40px 0;">
      <h3 style="color:#1c1917;font-size:17px;font-weight:700;margin:0 0 4px;">Producten</h3>
    </td></tr>
    <tr><td style="padding:0 40px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #1c1917;">
            <th style="padding:12px 16px;text-align:left;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
            <th style="padding:12px 16px;text-align:center;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Aantal</th>
            <th style="padding:12px 16px;text-align:right;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Bedrag</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </td></tr>
    <tr><td style="padding:16px 40px 0;">
      <table style="width:100%;font-size:15px;color:#333;">
        <tr><td style="padding:8px 0;">Subtotaal</td><td style="padding:8px 0;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
        <tr><td style="padding:8px 0;">Verzendkosten</td><td style="padding:8px 0;text-align:right;">${order.shipping_cost === 0 ? "Gratis" : formatPrice(order.shipping_cost)}</td></tr>
        <tr><td style="padding:14px 0;border-top:2px solid #1c1917;font-weight:700;font-size:18px;color:#1c1917;">Totaal</td><td style="padding:14px 0;border-top:2px solid #1c1917;text-align:right;font-weight:700;font-size:18px;color:#1c1917;">${formatPrice(order.total)}</td></tr>
      </table>
    </td></tr>
    ${addrHtml ? `<tr><td style="padding:24px 40px 0;"><h3 style="color:#1c1917;font-size:17px;font-weight:700;margin:0 0 8px;">Bezorgadres</h3>${addrHtml}</td></tr>` : ""}
    <tr><td style="padding:28px 40px 0;">
      <table style="width:100%;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0;font-size:15px;color:#92400e;line-height:1.6;"><strong>Levertijd:</strong> Voor 17:00 besteld? Vandaag nog verwerkt en binnen 1-3 werkdagen in huis.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:28px 40px 36px;">
      <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">Heb je vragen over je bestelling? Neem gerust contact met ons op via <a href="mailto:info@wavegitaar.nl" style="color:#c2410c;text-decoration:none;">info@wavegitaar.nl</a> of WhatsApp. We helpen je graag verder.</p>
      <p style="margin:16px 0 0;font-size:15px;color:#555;line-height:1.7;">Met vriendelijke groet,<br/><strong style="color:#1c1917;">Team WaveGitaar</strong></p>
    </td></tr>
    <tr><td style="background:#f5f5f4;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">WaveGitaar &middot; KvK 32137384 &middot; Eastein 18, 9136RD Peazens</p>
      <p style="margin:6px 0 0;font-size:12px;color:#bbb;">Deze e-mail is automatisch verzonden. Gelieve niet te reageren op dit bericht.</p>
    </td></tr>
  </table>
</body></html>`;
}

function buildNotifyEmail(order: {
  order_number: string;
  tracking_code: string;
  customer_email: string;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  customer_phone?: string | null;
  items: { product_name: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method?: string | null;
  shipping_address?: Record<string, unknown> | null;
}): string {
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${item.product_name}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#666;">${item.quantity}x</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#333;font-weight:600;">${formatPrice(item.total)}</td>
    </tr>
  `).join("");

  const addr = order.shipping_address as Record<string, string> | null;
  const addrHtml = addr ? `${addr.street || ""} ${addr.house_number || addr.housenumber || ""}${addr.addition ? " " + addr.addition : ""}, ${addr.postal_code || addr.postalcode || ""} ${addr.city || ""}, ${addr.country || "Nederland"}` : "Niet opgegeven";

  return `<!DOCTYPE html>
<html lang="nl"><body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table style="width:100%;max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <tr><td style="background:#c2410c;padding:28px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Nieuwe bestelling</h1>
      <p style="color:#fed7aa;margin:6px 0 0;font-size:15px;font-weight:600;">${order.order_number}</p>
    </td></tr>
    <tr><td style="padding:32px 40px 0;">
      <table style="width:100%;font-size:15px;color:#333;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#999;width:150px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Ordernummer</td><td style="padding:8px 0;font-weight:700;color:#1c1917;">${order.order_number}</td></tr>
        <tr><td style="padding:8px 0;color:#999;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Track &amp; Trace</td><td style="padding:8px 0;font-weight:700;color:#c2410c;">${order.tracking_code}</td></tr>
        <tr><td style="padding:8px 0;color:#999;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Klant</td><td style="padding:8px 0;">${order.customer_first_name || ""} ${order.customer_last_name || ""}</td></tr>
        <tr><td style="padding:8px 0;color:#999;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">E-mail</td><td style="padding:8px 0;">${order.customer_email}</td></tr>
        <tr><td style="padding:8px 0;color:#999;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Telefoon</td><td style="padding:8px 0;">${order.customer_phone || "Niet opgegeven"}</td></tr>
        <tr><td style="padding:8px 0;color:#999;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Betaalmethode</td><td style="padding:8px 0;">${order.payment_method || "Niet opgegeven"}</td></tr>
        <tr><td style="padding:8px 0;color:#999;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Bezorgadres</td><td style="padding:8px 0;">${addrHtml}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 40px 0;">
      <h3 style="color:#1c1917;font-size:17px;font-weight:700;margin:0 0 4px;">Producten</h3>
    </td></tr>
    <tr><td style="padding:0 40px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:2px solid #1c1917;">
          <th style="padding:10px 16px;text-align:left;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
          <th style="padding:10px 16px;text-align:center;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Aantal</th>
          <th style="padding:10px 16px;text-align:right;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Bedrag</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </td></tr>
    <tr><td style="padding:16px 40px 32px;">
      <table style="width:100%;font-size:15px;color:#333;">
        <tr><td style="padding:8px 0;">Subtotaal</td><td style="padding:8px 0;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
        <tr><td style="padding:8px 0;">Verzendkosten</td><td style="padding:8px 0;text-align:right;">${order.shipping_cost === 0 ? "Gratis" : formatPrice(order.shipping_cost)}</td></tr>
        <tr><td style="padding:14px 0;border-top:2px solid #1c1917;font-weight:700;font-size:18px;color:#1c1917;">Totaal</td><td style="padding:14px 0;border-top:2px solid #1c1917;text-align:right;font-weight:700;font-size:18px;color:#1c1917;">${formatPrice(order.total)}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY not configured");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
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
    const body = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const orderNumber = `WG-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const trackingCode = `WG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    let customerId: string | null = null;
    if (body.customer_email) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("email", body.customer_email)
        .maybeSingle();

      if (existing) {
        customerId = existing.id;
        await supabase.from("customers").update({
          first_name: body.customer_first_name ?? null,
          last_name: body.customer_last_name ?? null,
          phone: body.customer_phone ?? null,
        }).eq("id", customerId);
      } else {
        const { data: newCustomer } = await supabase.from("customers").insert({
          email: body.customer_email,
          first_name: body.customer_first_name ?? null,
          last_name: body.customer_last_name ?? null,
          phone: body.customer_phone ?? null,
          country: body.shipping_address?.country ?? "Nederland",
        }).select().single();
        customerId = newCustomer?.id ?? null;
      }
    }

    const { data: order, error: orderError } = await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_id: customerId,
      customer_email: body.customer_email ?? null,
      customer_first_name: body.customer_first_name ?? null,
      customer_last_name: body.customer_last_name ?? null,
      customer_phone: body.customer_phone ?? null,
      shipping_address: body.shipping_address ?? null,
      notes: body.notes ?? null,
      status: "nieuw",
      subtotal: body.subtotal,
      shipping_cost: body.shipping_cost,
      total: body.total,
      payment_method: body.payment_method ?? null,
      payment_status: body.pending ? "pending" : "paid",
      paid_at: body.pending ? null : new Date().toISOString(),
      tracking_code: trackingCode,
    }).select().single();

    if (orderError) {
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const items = (body.items ?? []).map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id ?? null,
      product_name: item.product_name,
      product_slug: item.product_slug ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) {
        console.error("order_items insert error:", itemsError);
      }
    }

    await supabase.from("payments").insert({
      order_id: order.id,
      provider_code: body.payment_method ?? "ideal",
      payment_method: body.payment_method ?? null,
      amount: body.total,
      status: "pending",
    });

    // If first name is missing, try looking it up from the profiles table by email
    let resolvedFirstName = body.customer_first_name ?? null;
    let resolvedLastName = body.customer_last_name ?? null;
    if (!resolvedFirstName && body.customer_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("email", body.customer_email)
        .maybeSingle();
      if (profile) {
        resolvedFirstName = profile.first_name || null;
        resolvedLastName = profile.last_name || null;
      }
    }

    const orderData = {
      order_number: orderNumber,
      tracking_code: trackingCode,
      customer_email: body.customer_email,
      customer_first_name: resolvedFirstName,
      customer_last_name: resolvedLastName,
      customer_phone: body.customer_phone ?? null,
      items: body.items ?? [],
      subtotal: body.subtotal,
      shipping_cost: body.shipping_cost,
      total: body.total,
      payment_method: body.payment_method ?? null,
      shipping_address: body.shipping_address ?? null,
    };

    if (!body.pending && body.customer_email) {
      await sendEmail(
        body.customer_email,
        `Bevestiging van je bestelling ${orderNumber} — WaveGitaar`,
        buildCustomerEmail(orderData)
      );
    }

    if (!body.pending) {
      await sendEmail(
        NOTIFY_EMAIL,
        `Nieuwe bestelling ${orderNumber} — WaveGitaar`,
        buildNotifyEmail(orderData)
      );
    }

    return new Response(JSON.stringify({ id: order.id, order_number: orderNumber, tracking_code: trackingCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

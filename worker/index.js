export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (url.pathname === '/webhook') {
      return handleStripeWebhook(request, env);
    }

    return handleSubscribe(request, env);
  },
};

// ─── Stripe webhook ────────────────────────────────────────────────────────────

async function handleStripeWebhook(request, env) {
  const rawBody = await request.text();
  const sig     = request.headers.get('Stripe-Signature') || '';

  const valid = await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(rawBody);
  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = event.data?.object?.customer_details?.email;
  if (!email) {
    return new Response('No email in event', { status: 400 });
  }

  const now  = Date.now();
  const day2  = new Date(now + 2  * 86400000).toISOString();
  const day5  = new Date(now + 5  * 86400000).toISOString();
  const day12 = new Date(now + 12 * 86400000).toISOString();

  await Promise.all([
    sendResend(env.RESEND_API_KEY, {
      to:      email,
      subject: "It's yours. Here's how to begin (gently).",
      html:    buildEmail1(),
    }),
    sendResend(env.RESEND_API_KEY, {
      to:           email,
      subject:      'Who gets the best of you?',
      html:         buildEmail2(),
      scheduled_at: day2,
    }),
    sendResend(env.RESEND_API_KEY, {
      to:           email,
      subject:      "If it's still sitting unopened",
      html:         buildEmail3(),
      scheduled_at: day5,
    }),
    sendResend(env.RESEND_API_KEY, {
      to:           email,
      subject:      'How is it landing?',
      html:         buildEmail4(),
      scheduled_at: day12,
    }),
  ]);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function verifyStripeSignature(rawBody, sigHeader, secret) {
  // sigHeader format: "t=1234,v1=abc...,v0=..."
  const parts = Object.fromEntries(
    sigHeader.split(',').map(p => p.split('=', 2))
  );
  const timestamp = parts['t'];
  const expected  = parts['v1'];
  if (!timestamp || !expected) return false;

  const enc    = new TextEncoder();
  const key    = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${rawBody}`));
  const hex    = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('');

  return hex === expected;
}

async function sendResend(apiKey, payload) {
  return fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from: 'Meagan at Velani <hello@velani.app>',
      reply_to: 'hello@velani.app',
      ...payload,
    }),
  });
}

// ─── Subscribe (existing flow) ─────────────────────────────────────────────────

async function handleSubscribe(request, env) {
  const body   = await request.json();
  const email  = body.email;
  const tags   = body.tags   || [];
  const fields = body.fields || {};

  const KIT_API_KEY    = env.KIT_API_KEY;
  const KIT_FORM_ID    = env.KIT_FORM_ID;
  const RESEND_API_KEY = env.RESEND_API_KEY;

  // 1. Kit subscribe
  await fetch(
    `https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe?api_key=${KIT_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: KIT_API_KEY,
        email,
        fields: Object.keys(fields).length > 0 ? fields : undefined,
      }),
    }
  );

  // 2. Resend audit email — only for audit completions
  if (tags.includes('audit-complete')) {
    const patternName   = fields.pattern_name   || '';
    const capacityScore = fields.capacity_score || '';
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'Meagan at Velani <hello@velani.app>',
        to:      email,
        subject: `Your Invisible Load result: ${patternName}`,
        html:    buildAuditEmail(patternName, capacityScore),
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ─── Email builders ────────────────────────────────────────────────────────────

function emailShell(hero, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F7F6F3;font-family:'DM Sans',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#F7F6F3;">
  <div style="background:#1A1D2E;padding:40px 40px 44px;text-align:center;">
    <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#5B8C7A;font-weight:600;">Velani</div>
    ${hero}
  </div>
  <div style="padding:32px 32px 40px;font-size:15px;color:#3a3d4e;line-height:1.85;">
    ${body}
  </div>
  <div style="padding:20px 32px 32px;text-align:center;border-top:1px solid #E8E4DC;">
    <p style="font-size:12px;color:#9b9ea8;line-height:1.7;margin:0;">
      <strong>VELANI</strong> · Making room for yourself again<br>
      <a href="https://velani.app/privacy" style="color:#5B8C7A;text-decoration:none;">Privacy</a> · <a href="https://velani.app" style="color:#5B8C7A;text-decoration:none;">velani.app</a>
    </p>
  </div>
</div>
</body></html>`;
}

function buildEmail1() {
  const hero = `<div style="margin-top:28px;font-family:Georgia,serif;font-size:26px;font-weight:500;color:#FDFCFA;line-height:1.25;">The Companion<br>is yours.</div>`;
  const body = `
    <p>Hi,</p>
    <p>The most important thing I want to tell you first:</p>
    <p><strong>Don't try to do all of it.</strong></p>
    <p>That instinct — to get through it, to do it properly, to not waste it — is exactly the pattern that's been wearing you out. So let's not start there.</p>
    <p>Instead, when you have twenty quiet minutes — not today if today is full — open to just <em>one part</em>. The audit pointed you to where your load is heaviest, and that's where the Companion begins. One part is enough to feel lighter.</p>
    <p><strong>Your two ways in:</strong></p>
    <p style="margin:6px 0;">→ <a href="https://velani.app/companion" style="color:#5B8C7A;text-decoration:none;font-weight:600;">Open the guided web version</a> (saves as you go)</p>
    <p style="margin:6px 0;">→ <a href="https://velani.app/The-Velani-Companion.pdf" style="color:#5B8C7A;text-decoration:none;font-weight:600;">Download the printable PDF</a></p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://velani.app/companion" style="display:inline-block;background:#1A1D2E;color:#F7F6F3;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">Begin the Companion →</a>
    </div>
    <hr style="border:none;border-top:1px solid #E8E4DC;margin:24px 0;">
    <p><strong>A promise, so you can relax into this:</strong> if the Companion doesn't help you make room, just reply to this email and I'll refund you. No forms. No questions. I mean that — I'd rather you trust me than keep your $39.</p>
    <p>One clear move at a time.</p>
    <p style="font-family:Georgia,serif;font-style:italic;color:#1A1D2E;">— Meagan</p>
  `;
  return emailShell(hero, body);
}

function buildEmail2() {
  const hero = `<div style="margin-top:28px;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#FDFCFA;line-height:1.3;font-style:italic;">Who gets the best of you?</div>`;
  const body = `
    <p>Hi,</p>
    <p>I want to share the idea at the heart of the Companion — because even if you haven't opened it yet, this one is worth carrying around in your head for a day.</p>
    <p>Here it is.</p>
    <p>Most of us give our most patient, most generous selves to people we barely know. The colleague. The acquaintance. The stranger we want to impress. We treat them like honoured guests.</p>
    <p>And the people closest to us — partner, children, parents — get whatever's left at the end of the day. Our most tired, most distracted selves.</p>
    <p><strong>And you? You come last of all.</strong></p>
    <p>There's a natural order to care, and most of us have it exactly backwards. Here's the part that matters, though: putting yourself back into that order isn't selfish. The depleted version of you doesn't serve anyone. When you keep some of your best for yourself, you become <em>more</em> capable for everyone you love — not less.</p>
    <p>That's the whole idea. Everything in the Companion comes back to it.</p>
    <p>No task today. Just one thing to notice, if you want to: <em>where in your life have you had the order of care backwards?</em></p>
    <p>That noticing is the beginning of everything.</p>
    <p style="font-family:Georgia,serif;font-style:italic;color:#1A1D2E;">— Meagan</p>
  `;
  return emailShell(hero, body);
}

function buildEmail3() {
  const hero = `<div style="margin-top:28px;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#FDFCFA;line-height:1.3;font-style:italic;">If it's still sitting unopened</div>`;
  const body = `
    <p>Hi,</p>
    <p>If you've already started the Companion — wonderful. Skip this one and go enjoy your weekend.</p>
    <p>But if it's still sitting there, unopened, in a tab or a folder or your downloads — I want to say something.</p>
    <p>That's completely normal. And it's not because you're lazy or undisciplined. It's because the very thing the Companion helps with — making room for yourself — is the thing you've been trained to put last. Of course it slipped to the bottom of the list. It always does. That's the whole point.</p>
    <p>So here's permission, if you need it: <strong>you don't have to earn the right to open it by getting everything else done first.</strong> That day doesn't come. You just begin.</p>
    <p>And if twenty minutes feels like too much, do this instead. Open it to the first part. Read only the page called <em>"What you're carrying here."</em> Write down one thing. Close it again.</p>
    <p>That counts. That's the whole practice in miniature. One honest look. One thing named. That's a beginning — and beginnings are all that's ever required.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://velani.app/companion" style="display:inline-block;background:#1A1D2E;color:#F7F6F3;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">Open to part one →</a>
    </div>
    <p style="font-family:Georgia,serif;font-style:italic;color:#1A1D2E;">— Meagan</p>
  `;
  return emailShell(hero, body);
}

function buildEmail4() {
  const hero = `<div style="margin-top:28px;font-family:Georgia,serif;font-size:24px;font-weight:500;color:#FDFCFA;line-height:1.3;font-style:italic;">How is it landing?</div>`;
  const body = `
    <p>Hi,</p>
    <p>It's been almost two weeks since the Companion became yours, and I've been wondering how it's landing for you.</p>
    <p>Not in a "did you finish it" way — there's nothing to finish. More in a real way. I built Velani because I needed it myself, and the thing I care about most isn't whether you completed a workbook. It's whether you feel even slightly more like yourself than you did two weeks ago.</p>
    <p>So I'd love to hear from you. Just hit reply and tell me one of these — whichever is true:</p>
    <p style="margin:4px 0 4px 16px;">- One thing you decided to put down.</p>
    <p style="margin:4px 0 4px 16px;">- One thing you're making room for.</p>
    <p style="margin:4px 0 4px 16px;">- Or just: where you are right now, honestly.</p>
    <p>I read every reply myself. Not a team, not an auto-responder — me. And I write back.</p>
    <p>That's the part of Velani I care about most: that you're not doing this alone, and that someone sees the effort it takes to finally make a little room for yourself.</p>
    <p>Whatever you've done with it — even if you've only thought about it — you've already started something most people never do. You turned toward yourself. That matters more than you know.</p>
    <p style="font-family:Georgia,serif;font-style:italic;color:#1A1D2E;">— Meagan</p>
  `;
  return emailShell(hero, body);
}

// ─── Audit email ──────────────────────────────────────────────────────────────

function buildAuditEmail(patternName, score) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#F7F6F3;font-family:'DM Sans',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#F7F6F3;">

  <!-- HERO -->
  <div style="background:#1A1D2E;padding:48px 40px 52px;text-align:center;">
    <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#5B8C7A;font-weight:600;margin-bottom:28px;">Velani</div>
    <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(247,246,243,.45);margin-bottom:14px;">Your result</div>
    <div style="font-family:Georgia,serif;font-size:30px;font-weight:500;color:#FDFCFA;line-height:1.2;margin-bottom:28px;">${patternName}</div>
    <div style="font-family:Georgia,serif;font-size:52px;font-weight:500;color:#FDFCFA;line-height:1;">${score}</div>
    <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(247,246,243,.4);margin-top:8px;">Capacity Score</div>
  </div>

  <!-- BODY -->
  <div style="padding:36px 32px 40px;font-size:15px;color:#3a3d4e;line-height:1.85;">

    <!-- Hook -->
    <p style="font-family:Georgia,serif;font-size:20px;color:#1A1D2E;line-height:1.45;margin-top:0;margin-bottom:6px;">You know where the weight is.</p>
    <p style="margin-top:0;margin-bottom:32px;">Now let's decide what no longer belongs to you.</p>

    <!-- Companion card -->
    <div style="background:#1A1D2E;border-radius:16px;padding:28px 28px 32px;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#5B8C7A;font-weight:600;margin-bottom:14px;">The Velani Companion</div>
      <div style="font-size:15px;color:rgba(247,246,243,.75);line-height:1.7;margin-bottom:20px;">The guided process that helps you:</div>
      <div style="font-size:15px;color:#FDFCFA;line-height:2.1;">
        <div>&#10003;&nbsp; uncover what you're carrying</div>
        <div>&#10003;&nbsp; decide what to keep</div>
        <div>&#10003;&nbsp; let go of what no longer belongs to you</div>
        <div>&#10003;&nbsp; reclaim the space for the life you actually want</div>
      </div>
    </div>

    <!-- Tagline -->
    <p style="font-size:13px;color:#9b9ea8;font-style:italic;text-align:center;margin-bottom:28px;">Because awareness changes nothing.<br>Reallocation changes everything.</p>

    <!-- Primary CTA -->
    <div style="text-align:center;margin-bottom:40px;">
      <a href="https://velani.app/companion" style="display:inline-block;background:#1A1D2E;color:#F7F6F3;text-decoration:none;padding:16px 36px;border-radius:12px;font-size:15px;font-weight:600;">Start with your Inner section &#8594;</a>
    </div>

    <hr style="border:none;border-top:1px solid #E8E4DC;margin:0 0 32px;">

    <!-- Velani Lite -->
    <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9b9ea8;margin-bottom:14px;">Keep the momentum going</div>
    <p style="margin-top:0;font-weight:600;color:#1A1D2E;">Velani Lite is your daily practice.</p>
    <p style="margin-top:0;">One meaningful move.<br>One Quiet Win.<br>Two minutes.<br>Free.</p>
    <div style="text-align:center;margin-top:24px;">
      <a href="https://velani.app/start" style="display:inline-block;border:1.5px solid #1A1D2E;color:#1A1D2E;text-decoration:none;padding:13px 32px;border-radius:12px;font-size:14px;font-weight:600;">Start Velani Lite — free</a>
    </div>

  </div>

  <!-- FOOTER -->
  <div style="padding:24px 32px 36px;text-align:center;border-top:1px solid #E8E4DC;">
    <p style="font-size:12px;color:#9b9ea8;line-height:1.7;margin:0;">
      <strong>VELANI</strong> · Making room for yourself again<br>
      <a href="https://velani.app/privacy" style="color:#5B8C7A;text-decoration:none;">Privacy</a> · <a href="https://velani.app" style="color:#5B8C7A;text-decoration:none;">velani.app</a>
    </p>
  </div>

</div>
</body></html>`;
}

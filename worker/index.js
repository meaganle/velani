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
    <p style="margin:4px 0 4px 16px;">— One thing you decided to put down.</p>
    <p style="margin:4px 0 4px 16px;">— One thing you're making room for.</p>
    <p style="margin:4px 0 4px 16px;">— Or just: where you are right now, honestly.</p>
    <p>I read every reply myself. Not a team, not an auto-responder — me. And I write back.</p>
    <p>That's the part of Velani I care about most: that you're not doing this alone, and that someone sees the effort it takes to finally make a little room for yourself.</p>
    <p>Whatever you've done with it — even if you've only thought about it — you've already started something most people never do. You turned toward yourself. That matters more than you know.</p>
    <p style="font-family:Georgia,serif;font-style:italic;color:#1A1D2E;">— Meagan</p>
  `;
  return emailShell(hero, body);
}

// ─── Audit email (existing) ────────────────────────────────────────────────────

function buildAuditEmail(patternName, score) {
  const insights = {
    'The Endless Pour':       'You\'re holding a great deal for the people in your life, and it\'s drawing down the energy you need for yourself. You\'re the one who keeps everyone afloat, and your own body and spirit are running on whatever\'s left at the end of the day.',
    'Running on Empty':       'You\'re carrying work and family at full capacity while your own body and inner life get almost nothing. You\'re the load-bearing wall holding everyone up, and walls don\'t get to rest. The first move isn\'t to carry it better. It\'s to put something down.',
    'Success Without Self':   'You\'re carrying your career and responsibilities at a high level, and from the outside it looks like you\'re doing well. But the person underneath the achievement has gone quiet. You\'ve been succeeding at everything except being yourself, and that\'s the most invisible load of all.',
    'The Quiet Disappearance':'Your practical life is actually manageable — work isn\'t crushing you, your responsibilities are under control. And yet you\'ve quietly lost touch with yourself. There\'s no crisis to point to, just a slow fade. That deserves attention precisely because nothing is forcing it.',
    'Holding It Together':    'No single domain is in crisis, but the cumulative weight is real. You\'re holding it together, and you\'re good at it. The risk isn\'t collapse — it\'s that holding it together quietly becomes the ceiling of your life, and the room for possibility slowly shrinks.',
    'Carrying Well':          'You\'re carrying well right now. You have real capacity, your load is relatively light, and your structures are working. What\'s true is that capacity erodes quietly — so the work now is protecting the space you have, deliberately, before the next busy season fills it.',
  };

  const wisdoms = {
    'The Endless Pour':       'There\'s an order to care most of us have upside down. We pour our best outward and give the people closest to us — and ourselves — what remains. <strong>You belong on your own list. Not last. On it.</strong>',
    'Running on Empty':       'There\'s an order to care most of us have upside down. We pour our best outward and give the people closest to us — and ourselves — what remains. <strong>You belong on your own list. Not last. On it.</strong>',
    'Success Without Self':   'Most of us give our sharpest selves to work and to people we barely know, and bring home what\'s left. <strong>The people closest to you — and you yourself — deserve more than your leftovers.</strong>',
    'The Quiet Disappearance':'Sometimes the most important thing missing isn\'t time or energy — it\'s <strong>you</strong>. Not the version that performs and provides, but the one underneath. She\'s still there, waiting to be made room for.',
    'Holding It Together':    'The load rarely announces itself. It accumulates quietly until \'fine but tired\' becomes normal. <strong>Noticing it now, while you still have room, is the whole advantage.</strong>',
    'Carrying Well':          'Capacity erodes quietly. Noticing it while you still have room — and protecting that room deliberately — <strong>is the whole advantage.</strong>',
  };

  const insight = insights[patternName] || 'You\'ve taken an honest look at where your energy is going. That\'s the first move — and it\'s not a small one.';
  const wisdom  = wisdoms[patternName]  || 'The load rarely announces itself. It accumulates quietly until \'fine but tired\' becomes normal. <strong>Noticing it now, while you still have room, is the whole advantage.</strong>';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#F7F6F3;font-family:'DM Sans',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#F7F6F3;">

  <!-- HERO -->
  <div style="background:#1A1D2E;padding:48px 40px 52px;text-align:center;">
    <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#5B8C7A;font-weight:600;margin-bottom:28px;">Velani</div>
    <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(247,246,243,.45);margin-bottom:14px;">Your result</div>
    <div style="font-family:Georgia,serif;font-size:30px;font-weight:500;color:#FDFCFA;line-height:1.2;margin-bottom:12px;">${patternName}</div>
    <div style="font-size:15px;color:rgba(247,246,243,.62);line-height:1.7;margin-bottom:32px;">Here's what your Invisible Load looks like right now.</div>
    <div style="font-family:Georgia,serif;font-size:48px;font-weight:500;color:#FDFCFA;line-height:1;">${score}</div>
    <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(247,246,243,.4);margin-top:6px;">Capacity Score / 100</div>
  </div>

  <!-- BODY -->
  <div style="padding:0 32px 40px;">

    <!-- Pattern insight -->
    <div style="background:#1A1D2E;border-radius:16px;padding:26px 24px;margin:24px 0;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#C4785A;margin-bottom:12px;">What your pattern means</div>
      <div style="font-family:Georgia,serif;font-size:17px;font-style:italic;color:#FDFCFA;line-height:1.7;">${insight}</div>
    </div>

    <!-- Wisdom -->
    <div style="background:#EBF2EF;border:1px solid #C5DDD7;border-radius:14px;padding:22px;margin-bottom:28px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#5B8C7A;margin-bottom:10px;">A truth worth sitting with</div>
      <div style="font-size:15px;color:#3a3d4e;line-height:1.75;">${wisdom}</div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;padding:8px 0 16px;">
      <div style="font-family:Georgia,serif;font-size:22px;color:#1A1D2E;line-height:1.3;margin-bottom:10px;">Your free next step is waiting</div>
      <div style="font-size:15px;color:#3a3d4e;line-height:1.7;margin-bottom:24px;">Velani Lite is a simple daily practice. One question. One clear move. Two minutes. Free.</div>
      <a href="https://velani.app/start" style="display:inline-block;background:#1A1D2E;color:#F7F6F3;text-decoration:none;padding:16px 36px;border-radius:12px;font-size:15px;font-weight:600;">Start Velani Lite — free</a>
      <div style="margin-top:14px;"><a href="https://buy.stripe.com/9B69AM3pRcSC8MJ4OR8N202" style="font-size:13px;color:#5B8C7A;text-decoration:none;">Or go deeper with the Velani Companion™ →</a></div>
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

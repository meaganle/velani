export default {
  async fetch(request, env) {
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
  },
};

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

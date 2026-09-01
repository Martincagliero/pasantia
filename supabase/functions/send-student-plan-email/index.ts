import { createClient } from 'jsr:@supabase/supabase-js@2';

const CAMPAIGN = 'student-pro-5000-v1';
const APP_URL = 'https://pasantia.com.ar';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'método no permitido' }, 405);

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'no autorizado' }, 401);

    const { user_id } = await request.json();
    if (typeof user_id !== 'string' || !user_id) return json({ error: 'user_id es requerido' }, 400);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) return json({ error: 'Falta configurar RESEND_API_KEY' }, 500);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const token = authorization.slice('Bearer '.length);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return json({ error: 'sesión inválida' }, 401);

    const { data: caller } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', authData.user.id)
      .maybeSingle();
    if (caller?.is_admin !== true) return json({ error: 'solo administradores' }, 403);

    const [{ data: profile }, { data: student }, { data: previous, error: logError }] = await Promise.all([
      admin
        .from('profiles')
        .select('id, full_name, email, role, plan, plan_expires_at')
        .eq('id', user_id)
        .maybeSingle(),
      admin
        .from('student_profiles')
        .select('university, career, year, area')
        .eq('id', user_id)
        .maybeSingle(),
      admin
        .from('plan_email_campaign_sends')
        .select('sent_at')
        .eq('campaign', CAMPAIGN)
        .eq('user_id', user_id)
        .maybeSingle(),
    ]);

    if (logError) return json({ error: 'Falta ejecutar migracion-email-plan-estudiantes.sql' }, 500);
    if (!profile || profile.role !== 'estudiante' || !profile.email) {
      return json({ error: 'el destinatario no es un estudiante válido' }, 400);
    }
    const hasActivePaidPlan = profile.plan !== 'free' && (
      profile.plan_expires_at === null || new Date(profile.plan_expires_at).getTime() > Date.now()
    );
    if (hasActivePaidPlan) return json({ error: 'el estudiante ya tiene un plan activo' }, 409);
    if (previous) return json({ sent: false, already_sent: true, sent_at: previous.sent_at });

    const fullName = String(profile.full_name || 'Estudiante').trim();
    const firstName = fullName.split(/\s+/)[0] || 'Estudiante';
    const safeFirstName = escapeHtml(firstName);
    const academicParts = [student?.career, student?.year ? `${student.year}° año` : null, student?.university]
      .filter(Boolean)
      .map((value) => escapeHtml(String(value)));
    const academicIntro = academicParts.length > 0
      ? `Vimos que estás avanzando en ${academicParts.join(' · ')} y queremos darte más herramientas para tu búsqueda.`
      : 'Queremos darte más herramientas para que avances en tu búsqueda de pasantías.';
    const activateUrl = `${APP_URL}/app/planes`;

    const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f2f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033">
    <div style="display:none;max-height:0;overflow:hidden">Desbloqueá postulaciones, conexiones y mensajes sin límites por $5.000 al mes.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f5f9;padding:28px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
          <tr><td align="center" style="background:#0a66c2;padding:34px 28px 30px">
            <img src="${APP_URL}/favicon.png" width="72" height="72" alt="PasantIA" style="display:block;border-radius:16px;margin:0 auto 18px">
            <p style="margin:0 0 8px;color:#dbeafe;font-size:13px;font-weight:700;text-transform:uppercase">Una invitación para vos</p>
            <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.15">Hola, ${safeFirstName}</h1>
            <p style="margin:12px auto 0;max-width:440px;color:#eaf3ff;font-size:16px;line-height:1.55">Tu próximo paso en PasantIA puede tener menos límites.</p>
          </td></tr>
          <tr><td style="padding:32px 34px">
            <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#475569">${academicIntro}</p>
            <h2 style="margin:0 0 16px;font-size:21px;color:#172033">Lo que desbloqueás con Estudiante Pro</h2>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr><td style="padding:8px 0;color:#334155;font-size:15px">✓ Postulaciones ilimitadas</td></tr>
              <tr><td style="padding:8px 0;color:#334155;font-size:15px">✓ Conexiones sin límite</td></tr>
              <tr><td style="padding:8px 0;color:#334155;font-size:15px">✓ Mensajes sin conexión previa</td></tr>
              <tr><td style="padding:8px 0;color:#334155;font-size:15px">✓ Perfil destacado primero en Explorar</td></tr>
              <tr><td style="padding:8px 0;color:#334155;font-size:15px">✓ Check Pro y acceso al programa de promotores</td></tr>
            </table>
            <div style="margin:25px 0;padding:20px;text-align:center;background:#f0f7ff;border:1px solid #cfe5ff;border-radius:12px">
              <p style="margin:0;color:#0a66c2;font-size:13px;font-weight:700;text-transform:uppercase">Precio mensual</p>
              <p style="margin:5px 0 0;color:#172033;font-size:30px;font-weight:800">$5.000 <span style="font-size:14px;font-weight:400;color:#64748b">ARS / mes</span></p>
            </div>
            <div style="text-align:center">
              <a href="${activateUrl}" style="display:inline-block;background:#0a66c2;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 24px;border-radius:999px">Quiero activar Estudiante Pro</a>
              <p style="margin:15px 0 0;color:#64748b;font-size:13px;line-height:1.5">Entrá a Planes, enviá tu solicitud y el equipo de PasantIA te contactará.</p>
            </div>
          </td></tr>
          <tr><td style="border-top:1px solid #e2e8f0;padding:20px 34px;text-align:center;color:#94a3b8;font-size:12px;line-height:1.5">
            Recibís este correo porque tenés una cuenta de estudiante en PasantIA.<br>
            <a href="${APP_URL}" style="color:#0a66c2;text-decoration:none">pasantia.com.ar</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

    const plainText = `Hola, ${firstName}.\n\n${academicIntro}\n\nCon Estudiante Pro desbloqueás postulaciones ilimitadas, conexiones sin límite, mensajes sin conexión previa, perfil destacado, Check Pro y acceso al programa de promotores.\n\nPrecio: $5.000 ARS por mes.\n\nActivá tu plan desde ${activateUrl}`;
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `${CAMPAIGN}-${user_id}`,
      },
      body: JSON.stringify({
        from: 'PasantIA <planes@pasantia.com.ar>',
        to: [profile.email],
        subject: `${firstName}, desbloqueá Estudiante Pro por $5.000 al mes`,
        html,
        text: plainText,
      }),
    });
    const resendResult = await resendResponse.json();
    if (!resendResponse.ok) {
      return json({ error: resendResult?.message || 'Resend rechazó el envío' }, 502);
    }

    const { error: insertError } = await admin.from('plan_email_campaign_sends').insert({
      campaign: CAMPAIGN,
      user_id,
      email: profile.email,
      resend_id: resendResult.id,
      sent_by: authData.user.id,
    });
    if (insertError && insertError.code !== '23505') {
      return json({ error: 'El correo salió, pero no se pudo registrar el envío' }, 500);
    }

    return json({ sent: true, id: resendResult.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'error inesperado' }, 500);
  }
});

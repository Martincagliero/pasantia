// Edge Function: valida un evento real contra el usuario autenticado y envía
// push directo o broadcast. El cliente nunca define destinatarios ni contenido.
// Usa el service role solo dentro del servidor para resolver recursos y
// suscripciones; esa clave nunca sale al frontend.
//
// Requiere estos SECRETS configurados en el proyecto de Supabase:
//   supabase secrets set VAPID_PUBLIC_KEY=...  VAPID_PRIVATE_KEY=...  VAPID_SUBJECT=mailto:holapasantia@gmail.com
// (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya vienen inyectados por Supabase.)
//
// Desplegar:  supabase functions deploy send-push
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'no autorizado' }, 401);

    const { event_type, resource_id } = await req.json();
    if (!event_type || !resource_id) {
      return json({ error: 'event_type y resource_id son requeridos' }, 400);
    }

    const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY');
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:holapasantia@gmail.com';
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return json({ error: 'Faltan las claves VAPID en los secrets' }, 500);
    }
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authorization.slice('Bearer '.length);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    const caller = authData.user;
    if (authError || !caller) return json({ error: 'sesión inválida' }, 401);

    let title = 'PasantIA';
    let body = '';
    let url = '/app';
    let recipientIds: string[] | null = null;
    let broadcast = false;
    let officialNotice = false;

    if (event_type === 'push_test') {
      if (resource_id !== caller.id) return json({ error: 'evento inválido' }, 403);
      title = 'Notificaciones activadas';
      body = 'Tu dispositivo ya puede recibir novedades de PasantIA.';
      url = '/app';
      recipientIds = [caller.id];
    } else if (event_type === 'message') {
      const { data: message } = await admin
        .from('messages')
        .select('sender_id, recipient_id, content')
        .eq('id', resource_id)
        .maybeSingle();
      if (!message || message.sender_id !== caller.id) return json({ error: 'evento inválido' }, 403);
      const { data: sender } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', caller.id)
        .maybeSingle();
      title = sender?.full_name ? `Mensaje de ${sender.full_name}` : 'Nuevo mensaje';
      body = String(message.content ?? '').slice(0, 140);
      url = '/app';
      recipientIds = [message.recipient_id];
    } else if (event_type === 'application') {
      const { data: application } = await admin
        .from('applications')
        .select('student_id, internship_id')
        .eq('id', resource_id)
        .maybeSingle();
      if (!application || application.student_id !== caller.id) {
        return json({ error: 'evento inválido' }, 403);
      }
      const [{ data: internship }, { data: student }] = await Promise.all([
        admin
          .from('internships')
          .select('company_id, title')
          .eq('id', application.internship_id)
          .maybeSingle(),
        admin.from('profiles').select('full_name').eq('id', caller.id).maybeSingle(),
      ]);
      if (!internship) return json({ error: 'pasantía no encontrada' }, 404);
      title = 'Nueva postulación recibida';
      body = `${student?.full_name || 'Un estudiante'} se postuló a ${internship.title}.`;
      url = '/app/postulaciones-recibidas';
      recipientIds = [internship.company_id];
    } else if (event_type === 'group_message') {
      const { data: message } = await admin
        .from('group_messages')
        .select('group_id, sender_id, content')
        .eq('id', resource_id)
        .maybeSingle();
      if (!message || message.sender_id !== caller.id) return json({ error: 'evento inválido' }, 403);
      const [{ data: group }, { data: sender }, { data: members }] = await Promise.all([
        admin.from('message_groups').select('name').eq('id', message.group_id).maybeSingle(),
        admin.from('profiles').select('full_name').eq('id', caller.id).maybeSingle(),
        admin.from('message_group_members').select('user_id').eq('group_id', message.group_id),
      ]);
      if (!group || !(members ?? []).some((member) => member.user_id === caller.id)) {
        return json({ error: 'evento inválido' }, 403);
      }
      title = group.name;
      body = `${sender?.full_name || 'Usuario'}: ${String(message.content ?? '').slice(0, 120)}`;
      url = '/app';
      recipientIds = (members ?? [])
        .map((member) => member.user_id)
        .filter((memberId) => memberId !== caller.id);
    } else if (event_type === 'connection_request' || event_type === 'connection_accepted') {
      const { data: connection } = await admin
        .from('connection_requests')
        .select('requester_id, recipient_id, status')
        .eq('id', resource_id)
        .maybeSingle();
      if (!connection) return json({ error: 'evento inválido' }, 404);
      const requesting = event_type === 'connection_request';
      const valid = requesting
        ? connection.requester_id === caller.id && connection.status === 'pending'
        : connection.recipient_id === caller.id && connection.status === 'accepted';
      if (!valid) return json({ error: 'evento inválido' }, 403);
      const { data: actor } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', caller.id)
        .maybeSingle();
      title = requesting ? 'Nueva solicitud de conexión' : 'Conexión aceptada';
      body = requesting
        ? `${actor?.full_name || 'Un estudiante'} quiere conectar con vos.`
        : `${actor?.full_name || 'Un estudiante'} aceptó tu solicitud de conexión.`;
      url = requesting ? '/app/explorar?tab=red' : '/app/explorar?tab=red';
      recipientIds = [requesting ? connection.recipient_id : connection.requester_id];
    } else if (event_type === 'post') {
      const { data: post } = await admin
        .from('posts')
        .select('author_id, author_name, title')
        .eq('id', resource_id)
        .maybeSingle();
      if (!post || post.author_id !== caller.id) return json({ error: 'evento inválido' }, 403);
      const { data: author } = await admin
        .from('profiles')
        .select('is_admin')
        .eq('id', caller.id)
        .maybeSingle();
      const official = author?.is_admin === true;
      officialNotice = official;
      title = official ? 'Aviso oficial de PasantIA' : 'Nueva publicación en Novedades';
      body = official ? post.title : `${post.author_name || 'Usuario'}: ${post.title}`;
      url = '/app/novedades';
      broadcast = true;
    } else if (event_type === 'internship') {
      const { data: internship } = await admin
        .from('internships')
        .select('company_id, title, company_name, is_active')
        .eq('id', resource_id)
        .maybeSingle();
      if (!internship || internship.company_id !== caller.id || !internship.is_active) {
        return json({ error: 'evento inválido' }, 403);
      }
      title = 'Nueva pasantía publicada';
      body = internship.company_name
        ? `${internship.title} · ${internship.company_name}`
        : internship.title;
      url = '/app/pasantias';
      broadcast = true;
    } else if (event_type === 'member') {
      const { data: member } = await admin
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', resource_id)
        .maybeSingle();
      if (!member || member.id !== caller.id || !['estudiante', 'empresa'].includes(member.role)) {
        return json({ error: 'evento inválido' }, 403);
      }
      let memberName = member.full_name || 'Un nuevo usuario';
      if (member.role === 'empresa') {
        const { data: company } = await admin
          .from('company_profiles')
          .select('company_name')
          .eq('id', member.id)
          .maybeSingle();
        memberName = company?.company_name || memberName;
      }
      title = member.role === 'empresa' ? 'Nueva empresa en PasantIA' : 'Nuevo estudiante en PasantIA';
      body = `${memberName} se sumó a la plataforma.`;
      url = `/app/explorar?u=${member.id}`;
      broadcast = true;
    } else if (event_type === 'plan_resolved') {
      const [{ data: request }, { data: adminProfile }] = await Promise.all([
        admin
          .from('plan_requests')
          .select('user_id, kind, requested_plan, status')
          .eq('id', resource_id)
          .maybeSingle(),
        admin.from('profiles').select('is_admin').eq('id', caller.id).maybeSingle(),
      ]);
      if (!request || adminProfile?.is_admin !== true || request.status === 'pending') {
        return json({ error: 'evento inválido' }, 403);
      }
      const approved = request.status === 'approved';
      const isPromoter = request.kind === 'promoter';
      title = approved
        ? isPromoter ? 'Ya sos promotor/a de PasantIA' : 'Tu plan ya está activo'
        : isPromoter ? 'Solicitud de promotor revisada' : 'Solicitud de plan revisada';
      body = approved
        ? isPromoter
          ? 'Tu enlace personal ya está habilitado.'
          : request.requested_plan === 'pro'
            ? 'Ya tenés activos tus beneficios Pro y, si sos estudiante, tu enlace de promotor.'
            : 'Ya podés usar todos los beneficios de tu nuevo plan.'
        : 'Esta vez la solicitud no fue aprobada.';
      url = isPromoter ? '/app/promotores' : '/app/planes';
      recipientIds = [request.user_id];
    } else {
      return json({ error: 'tipo de evento no soportado' }, 400);
    }

    let subscriptionsQuery = admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id');
    if (broadcast) {
      subscriptionsQuery = subscriptionsQuery.neq('user_id', caller.id);
    } else {
      subscriptionsQuery = subscriptionsQuery.in('user_id', recipientIds ?? []);
    }
    const { data: subs, error: subscriptionsError } = await subscriptionsQuery;
    if (subscriptionsError) return json({ error: subscriptionsError.message }, 500);

    let deliverableSubs = subs ?? [];
    if (deliverableSubs.length > 0) {
      const subscribedUserIds = [...new Set(deliverableSubs.map((subscription) => subscription.user_id))];
      const { data: recipients } = await admin
        .from('profiles')
        .select('id, role')
        .in('id', subscribedUserIds);
      const companyIds = new Set(
        (recipients ?? [])
          .filter((recipient) => recipient.role === 'empresa')
          .map((recipient) => recipient.id)
      );
      const allowedForCompany = officialNotice || ['push_test', 'message', 'group_message', 'application'].includes(event_type);
      if (!allowedForCompany) {
        deliverableSubs = deliverableSubs.filter((subscription) => !companyIds.has(subscription.user_id));
      }
    }

    const payload = JSON.stringify({
      title,
      body,
      url,
    });

    let sent = 0;
    for (const s of deliverableSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        // Suscripción vencida / inválida -> la borramos.
        const code = err?.statusCode;
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      }
    }

    return json({ sent, event_type, broadcast });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

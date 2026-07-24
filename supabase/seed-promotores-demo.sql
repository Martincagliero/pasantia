-- =============================================================================
-- SEED DEMO: promotores + referidos de ejemplo (para ver el ranking con datos)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de las migraciones de promotores.
-- =============================================================================
-- Crea promotores demo (sin vincular a un perfil real) y algunas solicitudes
-- de acceso anticipado "de ejemplo" atribuidas a ellos. Todo lo demo usa el
-- dominio @demo.pasantia para poder borrarlo fácil después.
-- =============================================================================

-- 1) Promotores demo
INSERT INTO promoters (code, nombre) VALUES
  ('sofia', 'Sofía Gómez'),
  ('mateo', 'Mateo Fernández'),
  ('valen', 'Valentina Ruiz'),
  ('tomas', 'Tomás Herrera')
ON CONFLICT (code) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 2) Referidos demo (solicitudes de acceso anticipado atribuidas a cada promotor)
--    Mezcla de roles y estados para que el ranking muestre el desglose.
INSERT INTO early_access_requests (rol, nombre, email, referred_by, status, created_at)
VALUES
  -- sofia: fuerte en estudiantes
  ('estudiante', 'Demo Est 1',  'demo1@demo.pasantia',  'sofia', 'pendiente', NOW() - INTERVAL '6 days'),
  ('estudiante', 'Demo Est 2',  'demo2@demo.pasantia',  'sofia', 'activado',  NOW() - INTERVAL '5 days'),
  ('estudiante', 'Demo Est 3',  'demo3@demo.pasantia',  'sofia', 'pendiente', NOW() - INTERVAL '4 days'),
  ('estudiante', 'Demo Est 4',  'demo4@demo.pasantia',  'sofia', 'activado',  NOW() - INTERVAL '3 days'),
  ('empresa',    'Demo Emp 1',  'demo5@demo.pasantia',  'sofia', 'pendiente', NOW() - INTERVAL '2 days'),

  -- mateo: mezcla estudiantes + empresas
  ('estudiante', 'Demo Est 5',  'demo6@demo.pasantia',  'mateo', 'pendiente', NOW() - INTERVAL '5 days'),
  ('estudiante', 'Demo Est 6',  'demo7@demo.pasantia',  'mateo', 'activado',  NOW() - INTERVAL '4 days'),
  ('empresa',    'Demo Emp 2',  'demo8@demo.pasantia',  'mateo', 'pendiente', NOW() - INTERVAL '3 days'),
  ('empresa',    'Demo Emp 3',  'demo9@demo.pasantia',  'mateo', 'activado',  NOW() - INTERVAL '2 days'),

  -- valen: estudiantes + una comunidad
  ('estudiante', 'Demo Est 7',  'demo10@demo.pasantia', 'valen', 'pendiente', NOW() - INTERVAL '4 days'),
  ('embajador',  'Demo Com 1',  'demo11@demo.pasantia', 'valen', 'pendiente', NOW() - INTERVAL '3 days'),

  -- tomas: recién arranca
  ('estudiante', 'Demo Est 8',  'demo12@demo.pasantia', 'tomas', 'pendiente', NOW() - INTERVAL '1 days')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Verificar el ranking:
--   SELECT * FROM public_promoter_ranking();
--
-- BORRAR todo lo demo cuando quieras:
--   DELETE FROM early_access_requests WHERE email LIKE '%@demo.pasantia';
--   DELETE FROM promoters WHERE code IN ('sofia','mateo','valen','tomas');
-- =============================================================================

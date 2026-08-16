-- Elimina exclusivamente las cuentas conocidas de estudiantes DEMO.
-- No usa patrones amplios para evitar tocar usuarios reales.

DELETE FROM auth.users
WHERE lower(email) IN (
  'pasantia.estudiante.demo@gmail.com',
  'pasantia.demo.valentina@gmail.com',
  'pasantia.demo.mateo@gmail.com'
);

-- Respaldo por si alguna instalación antigua no tenía ON DELETE CASCADE.
DELETE FROM public.profiles
WHERE lower(email) IN (
  'pasantia.estudiante.demo@gmail.com',
  'pasantia.demo.valentina@gmail.com',
  'pasantia.demo.mateo@gmail.com'
);

DELETE FROM public.early_access_requests
WHERE lower(email) IN (
  'pasantia.estudiante.demo@gmail.com',
  'pasantia.demo.valentina@gmail.com',
  'pasantia.demo.mateo@gmail.com'
);

SELECT id, email, role
FROM public.profiles
WHERE lower(email) IN (
  'pasantia.estudiante.demo@gmail.com',
  'pasantia.demo.valentina@gmail.com',
  'pasantia.demo.mateo@gmail.com'
);
# 📋 Instrucciones: Ejecutar Migraciones SQL en Supabase

## ⚠️ REGLA IMPORTANTE
**NO ejecutar múltiples `ALTER TYPE` en una sola consulta.** Supabase las ejecuta en transacción, y PostgreSQL no permite eso.

---

## 1️⃣ Migracion Candidatos

### Paso 1: ALTER TYPE (ejecutar de una en una)
Ve a **Supabase > SQL Editor > New query** y ejecuta estas líneas **POR SEPARADO** (copia una, corre, borra, copia la siguiente):

```sql
alter type application_status add value if not exists 'en_revision';
```

```sql
alter type application_status add value if not exists 'entrevista';
```

```sql
alter type application_status add value if not exists 'prueba_tecnica';
```

```sql
alter type application_status add value if not exists 'seleccionado';
```

### Paso 2: Agregar columna
En una nueva query ejecuta:

```sql
alter table public.applications add column if not exists is_favorite boolean not null default false;
```

✅ **Listo**

---

## 2️⃣ Migracion Embajadores

### Paso 1: ALTER TYPE (UNA sola vez, en query separada)

```sql
alter type user_role add value if not exists 'embajador';
```

### Paso 2: Todo lo demás
Copia el contenido de `supabase/migracion-embajadores.sql` **a partir de la línea que dice "-- 2) Perfil de embajador"** y ejecuta en una nueva query.

(Omite todo lo comentado al inicio, ejecuta desde la tabla `ambassador_profiles`)

✅ **Listo**

---

## ✨ Resumen Visual

```
❌ MAL: Ejecutar todo junto en 1 query
```sql
alter type user_role add value if not exists 'embajador';
alter type application_status add value if not exists 'en_revision';
-- Falla: ERROR: tipos no pueden cambiar dentro de transacción
```

```
✅ BIEN: Ejecutar cada ALTER en su propia query
```sql
/* Query 1 */
alter type user_role add value if not exists 'embajador';

/* Query 2 */
alter type application_status add value if not exists 'en_revision';

/* Query 3 */
alter type application_status add value if not exists 'entrevista';
```

---

## 📞 Si sigue fallando
- Borra la query anterior (Ctrl+A, Delete)
- Copia/pega exactamente una línea
- Clickea **Run** (sin modificar nada)
- Repite para cada ALTER TYPE

Si ves "value already exists", está bien - significa que ya se ejecutó antes.

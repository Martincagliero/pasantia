#!/usr/bin/env python3
"""
Script para ejecutar las migraciones de base de datos en Supabase
Ejecuta: python3 run_migrations.py
"""

import subprocess
import sys

# Leer el archivo ALL_SETUP.sql
with open('supabase/ALL_SETUP.sql', 'r') as f:
    sql_content = f.read()

# Usar supabase CLI para ejecutar el SQL
# Primero, intentamos con supabase db execute
print("🔄 Ejecutando migraciones de base de datos...")
print("=" * 60)

# Dividir el script en chunks si es necesario para evitar timeout
queries = [q.strip() for q in sql_content.split(';') if q.strip()]

print(f"Total de queries a ejecutar: {len(queries)}")
print("\n✋ IMPORTANTE: Necesitas tener logueada la sesión en Supabase CLI.")
print("Para ello, ejecuta primero: supabase login")
print("\nAlternativamente, puedes pegar manualmente el contenido de:")
print("supabase/ALL_SETUP.sql")
print("\nEn: Supabase Dashboard > SQL Editor > Nueva query")
print("=" * 60)

# Intentar ejecutar a través de la CLI (requiere estar logueado)
try:
    result = subprocess.run(
        ['supabase', 'db', 'execute', '--stdin'],
        input=sql_content.encode(),
        capture_output=True,
        text=False,
        timeout=60
    )
    
    if result.returncode == 0:
        print("✅ Migraciones ejecutadas exitosamente!")
        print(result.stdout.decode() if result.stdout else "")
    else:
        print("❌ Error al ejecutar migraciones:")
        print(result.stderr.decode() if result.stderr else "")
        print("\nIntenta hacer login primero con: supabase login")
        sys.exit(1)
        
except subprocess.TimeoutExpired:
    print("⏱️ Timeout ejecutando migraciones")
    sys.exit(1)
except FileNotFoundError:
    print("❌ supabase CLI no está instalada")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

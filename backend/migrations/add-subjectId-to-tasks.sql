-- Migración para agregar el campo subjectId a la tabla tasks
-- Este campo ya existe como foreign key, pero ahora lo hacemos explícito

-- No necesitamos agregar una nueva columna porque TypeORM ya la tenía
-- Solo necesitamos asegurarnos de que el campo esté bien configurado

-- Si por alguna razón el campo no existe, descomentar la siguiente línea:
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "subjectId" uuid;

-- Verificar que la foreign key existe
-- ALTER TABLE tasks 
-- ADD CONSTRAINT IF NOT EXISTS "FK_tasks_subjects" 
-- FOREIGN KEY ("subjectId") REFERENCES subjects("subjectId") ON DELETE CASCADE;

-- Esta migración es informativa - TypeORM ya maneja el campo subjectId
-- Solo necesitas reiniciar el backend para que los cambios en la entidad se reflejen


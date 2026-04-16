-- =============================================
-- SISTEMA DE RENDICIONES DE GASTOS - SQL para Supabase
-- Ejecutar este script en el Editor SQL de Supabase
-- =============================================

-- 1. Crear tipos enumerados
CREATE TYPE tipo_gasto AS ENUM ('peaje', 'alimentacion', 'estacionamiento', 'combustible', 'mantenimiento', 'otros');
CREATE TYPE estado_rendicion AS ENUM ('pendiente', 'aprobado', 'rechazado', 'pagado');

-- 2. Crear tabla profiles (extiende auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'conductor' CHECK (role IN ('conductor', 'jefatura', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear tabla rendiciones
CREATE TABLE public.rendiciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conductor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo_gasto tipo_gasto NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  fecha_gasto DATE NOT NULL,
  hora_gasto TIME NOT NULL,
  estado estado_rendicion DEFAULT 'pendiente',
  imagen_documento TEXT,
  imagen_transferencia TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendiciones ENABLE ROW LEVEL SECURITY;

-- 5. Policies para profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- 6. Policies para rendiciones
-- Conductor: crear sus propias rendiciones
CREATE POLICY "Conductores crean rendiciones" ON public.rendiciones
  FOR INSERT WITH CHECK (conductor_id = auth.uid());

-- Conductor: ver sus propias rendiciones
CREATE POLICY "Conductores ven sus rendiciones" ON public.rendiciones
  FOR SELECT USING (conductor_id = auth.uid());

-- Conductor: actualizar sus propias rendiciones solo si están pendientes
CREATE POLICY "Conductores actualizan sus rendiciones pendientes" ON public.rendiciones
  FOR UPDATE USING (
    conductor_id = auth.uid() AND 
    estado = 'pendiente'
  );

-- Conductor: eliminar sus propias rendiciones solo si están pendientes
CREATE POLICY "Conductores eliminan sus rendiciones pendientes" ON public.rendiciones
  FOR DELETE USING (conductor_id = auth.uid() AND estado = 'pendiente');

-- Admin: ver todas las rendiciones
CREATE POLICY "Admin ve todas las rendiciones" ON public.rendiciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin: actualizar cualquier rendición
CREATE POLICY "Admin actualiza cualquier rendicion" ON public.rendiciones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Jefatura: ver todas las rendiciones (solo lectura)
CREATE POLICY "Jefatura ve todas las rendiciones" ON public.rendiciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'jefatura'
    )
  );

-- Jefatura: crear sus propias rendiciones
CREATE POLICY "Jefatura crea rendiciones" ON public.rendiciones
  FOR INSERT WITH CHECK (conductor_id = auth.uid());

-- Jefatura: actualizar sus propias rendiciones solo si están pendientes
CREATE POLICY "Jefatura actualiza sus rendiciones pendientes" ON public.rendiciones
  FOR UPDATE USING (
    conductor_id = auth.uid() AND 
    estado = 'pendiente'
  );

-- Jefatura: eliminar sus propias rendiciones solo si están pendientes
CREATE POLICY "Jefatura elimina sus rendiciones pendientes" ON public.rendiciones
  FOR DELETE USING (conductor_id = auth.uid() AND estado = 'pendiente');

-- 7. Crear función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'conductor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear trigger para nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Crear bucket de storage para documentos
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true);

-- 10. Policies para storage
-- Cualquier usuario autenticado puede subir documentos
CREATE POLICY "Users can upload documentos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos' AND 
    auth.role() = 'authenticated'
  );

-- Cualquiera puede ver documentos
CREATE POLICY "Anyone can view documentos" ON storage.objects
  FOR SELECT USING (bucket_id = 'documentos');

-- Dueño del documento puede eliminarlo
CREATE POLICY "Users can delete their documentos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documentos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 11. Crear índice para mejor rendimiento
CREATE INDEX idx_rendiciones_conductor ON public.rendiciones(conductor_id);
CREATE INDEX idx_rendiciones_estado ON public.rendiciones(estado);
CREATE INDEX idx_rendiciones_fecha ON public.rendiciones(fecha_gasto);
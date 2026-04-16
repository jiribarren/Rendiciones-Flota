# Sistema de Rendiciones de Gastos

Aplicación web para administrar rendiciones de gastos de conductores de flota propia.

## Características

### Para Conductores (Móvil)
- Login con email y contraseña
- Crear rendiciones de gastos (Peaje, Alimentación, Estacionamiento, Combustible, Mantenimiento, Otros)
- Adjuntar foto del documento fiscal
- Editar/Eliminar rendiciones pendientes
- Ver estado de sus rendiciones

### Para Administrador (PC)
- Dashboard con estadísticas y gráficos
- Lista de todas las rendiciones con filtros
- Ver imagen del documento fiscal
- Aprobar/Rechazar rendiciones pendientes
- Marcar como pagado y adjuntar comprobante de transferencia
- Vista detallada por cada rendición

## Tech Stack
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Despliegue:** Vercel
- **Repositorio:** GitHub

## Getting Started

### 1. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar las credenciales del proyecto (URL y anon key)
3. Ejecutar el script `supabase-setup.sql` en el Editor SQL de Supabase

### 2. Configurar variables de entorno

Editar `.env.local` con tus credenciales:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Ejecutar localmente

```bash
cd rendiciones-flotas
npm run dev
```

### 4. Deploy

1. Subir código a GitHub
2. Importar proyecto en Vercel
3. Configurar variables de entorno en Vercel
4. Deploy automático en cada push

## Crear usuarios

En Supabase Dashboard:
1. Ir a Authentication > Users
2. "Add user" con email y contraseña temporal
3. El perfil se crea automáticamente con role "conductor"
4. Para crear admin, editar el perfil y cambiar role a "admin"

## Estructura del Proyecto

```
rendiciones-flotas/
├── app/
│   ├── (auth)/login/        # Login
│   ├── (conductor)/         # Rutas para conductores
│   │   ├── dashboard/       # Lista de mis rendiciones
│   │   ├── nueva/          # Crear rendición
│   │   └── rendicion/[id]/ # Detalle/editar
│   ├── (admin)/            # Rutas para admin
│   │   ├── page.tsx        # Dashboard stats
│   │   ├── rendiciones/    # Lista completa
│   │   └── rendicion/[id]/ # Detalle + acciones
│   └── providers.tsx       # Auth context
├── lib/supabase/           # Cliente Supabase
└── types/                  # TypeScript types
```
export type TipoGasto = 'peaje' | 'alimentacion' | 'estacionamiento' | 'combustible' | 'mantenimiento' | 'otros'
export type EstadoRendicion = 'pendiente' | 'aprobado' | 'rechazado' | 'pagado'
export type UserRole = 'conductor' | 'jefatura' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Rendicion {
  id: string
  conductor_id: string
  tipo_gasto: TipoGasto
  monto: number
  descripcion: string | null
  fecha_gasto: string
  hora_gasto: string
  estado: EstadoRendicion
  imagen_documento: string | null
  imagen_transferencia: string | null
  created_at: string
  updated_at: string
  // Joined fields
  conductor_name?: string
  conductor_email?: string
}

export interface RendicionWithConductor extends Rendicion {
  profiles?: {
    full_name: string | null
    email: string
  }
}

export const TIPO_GASTO_LABELS: Record<TipoGasto, string> = {
  peaje: 'Peaje',
  alimentacion: 'Alimentación',
  estacionamiento: 'Estacionamiento',
  combustible: 'Combustible',
  mantenimiento: 'Mantenimiento',
  otros: 'Otros'
}

export const ESTADO_LABELS: Record<EstadoRendicion, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  pagado: 'Pagado'
}
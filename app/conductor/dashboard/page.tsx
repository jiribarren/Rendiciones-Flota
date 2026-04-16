'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Rendicion, TIPO_GASTO_LABELS, ESTADO_LABELS, TipoGasto, EstadoRendicion } from '@/types'
import Link from 'next/link'
import { Plus, Image, ChevronRight, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardConductor() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [rendiciones, setRendiciones] = useState<Rendicion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      fetchRendiciones()
    }
  }, [user, filtroEstado])

  const fetchRendiciones = async () => {
    let query = supabase
      .from('rendiciones')
      .select('*')
      .eq('conductor_id', user?.id)
      .order('created_at', { ascending: false })

    if (filtroEstado !== 'todos') {
      query = query.eq('estado', filtroEstado)
    }

    const { data } = await query
    setRendiciones(data || [])
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile || profile.role !== 'conductor') {
    return null
  }

  const pendienteCount = rendiciones.filter(r => r.estado === 'pendiente').length
  const totalMonto = rendiciones.reduce((sum, r) => sum + r.monto, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Mis Rendiciones</h1>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <p className="text-sm text-gray-500">Bienvenido</p>
          <p className="font-semibold text-gray-900">{profile.full_name || profile.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600">Pendientes</p>
            <p className="text-2xl font-bold text-blue-900">{pendienteCount}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-600">Total gastado</p>
            <p className="text-2xl font-bold text-green-900">${totalMonto.toLocaleString('es-CL')}</p>
          </div>
        </div>

        <Link
          href="/conductor/nueva"
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-xl mb-6 transition"
        >
          <Plus className="w-5 h-5" />
          Nueva Rendición
        </Link>

        <div className="mb-4">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>

        <div className="space-y-3">
          {rendiciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay rendiciones yet
            </div>
          ) : (
            rendiciones.map((rendicion) => (
              <Link
                key={rendicion.id}
                href={`/conductor/rendicion/${rendicion.id}`}
                className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      rendicion.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      rendicion.estado === 'aprobado' ? 'bg-blue-100 text-blue-800' :
                      rendicion.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ESTADO_LABELS[rendicion.estado as EstadoRendicion]}
                    </span>
                    <h3 className="font-semibold text-gray-900 mt-2">
                      {TIPO_GASTO_LABELS[rendicion.tipo_gasto as TipoGasto]}
                    </h3>
                    <p className="text-sm text-gray-500">{rendicion.descripcion}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${rendicion.monto.toLocaleString('es-CL')}</p>
                    <p className="text-xs text-gray-500">{rendicion.fecha_gasto}</p>
                    {rendicion.imagen_documento && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                        <Image className="w-3 h-3" /> Foto
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
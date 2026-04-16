'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { Rendicion, TIPO_GASTO_LABELS, ESTADO_LABELS, TipoGasto, EstadoRendicion } from '@/types'
import Link from 'next/link'
import { ArrowLeft, Image, Search } from 'lucide-react'

export default function ListaRendicionesJefatura() {
  const { user, profile, loading: authLoading } = useAuth()
  const [rendiciones, setRendiciones] = useState<Rendicion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user && profile?.role === 'jefatura') {
      fetchRendiciones()
    }
  }, [user, profile, filtroEstado])

  const fetchRendiciones = async () => {
    let query = supabase
      .from('rendiciones')
      .select('*, profiles!rendiciones_conductor_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })

    if (filtroEstado !== 'todos') {
      query = query.eq('estado', filtroEstado)
    }

    const { data } = await query
    setRendiciones(data || [])
    setLoading(false)
  }

  const rendicionesFiltradas = rendiciones.filter(r => {
    if (!busqueda) return true
    const conductor = (r as any).profiles?.full_name || (r as any).profiles?.email || ''
    return conductor.toLowerCase().includes(busqueda.toLowerCase()) ||
           r.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile || profile.role !== 'jefatura') {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Rendiciones - Jefatura</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por conductor o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Conductor</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Monto</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Estado</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Docs</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rendicionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No hay rendiciones
                    </td>
                  </tr>
                ) : (
                  rendicionesFiltradas.map((rendicion) => (
                    <tr key={rendicion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {(rendicion as any).profiles?.full_name || '-'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(rendicion as any).profiles?.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {TIPO_GASTO_LABELS[rendicion.tipo_gasto as TipoGasto]}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ${rendicion.monto.toLocaleString('es-CL')}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {rendicion.fecha_gasto}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          rendicion.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          rendicion.estado === 'aprobado' ? 'bg-blue-100 text-blue-800' :
                          rendicion.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ESTADO_LABELS[rendicion.estado as EstadoRendicion]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {rendicion.imagen_documento && (
                          <span className="text-purple-600">
                            <Image className="w-5 h-5" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/jefatura/rendicion/${rendicion.id}`}
                          className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
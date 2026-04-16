'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { Rendicion, TIPO_GASTO_LABELS, ESTADO_LABELS, TipoGasto, EstadoRendicion } from '@/types'
import { Download, ArrowLeft, Calendar, Filter } from 'lucide-react'

export default function ReportesAdmin() {
  const { user, profile, loading: authLoading } = useAuth()
  const [rendiciones, setRendiciones] = useState<Rendicion[]>([])
  const [conductores, setConductores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [filtroConductor, setFiltroConductor] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchData()
    }
  }, [user, profile])

  const fetchData = async () => {
    const [rendData, perfilData] = await Promise.all([
      supabase.from('rendiciones').select('*').order('fecha_gasto', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email').order('full_name')
    ])
    setRendiciones(rendData.data || [])
    setConductores(perfilData.data || [])
    setLoading(false)
  }

  const exportarExcel = () => {
    const data = rendicionesFiltradas.map(r => {
      const conductor = conductores.find(c => c.id === r.conductor_id)
      return {
        Fecha: r.fecha_gasto,
        Hora: r.hora_gasto,
        Conductor: conductor?.full_name || conductor?.email || 'Desconocido',
        'Tipo Gasto': TIPO_GASTO_LABELS[r.tipo_gasto as TipoGasto],
        Monto: r.monto,
        Descripción: r.descripcion || '',
        Estado: ESTADO_LABELS[r.estado as EstadoRendicion],
        'Doc Fiscal': r.imagen_documento ? 'Sí' : 'No',
        Transferencia: r.imagen_transferencia ? 'Sí' : 'No'
      }
    })

    const headers = Object.keys(data[0] || {}).join(',')
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    const csv = [headers, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rendiciones_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const rendicionesFiltradas = rendiciones.filter(r => {
    if (filtroFechaInicio && r.fecha_gasto < filtroFechaInicio) return false
    if (filtroFechaFin && r.fecha_gasto > filtroFechaFin) return false
    if (filtroConductor && r.conductor_id !== filtroConductor) return false
    if (filtroEstado && r.estado !== filtroEstado) return false
    return true
  })

  const totalMonto = rendicionesFiltradas.reduce((sum, r) => sum + r.monto, 0)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
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
            <h1 className="text-xl font-bold text-gray-900">Reportes - Exportar Datos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Conductor</label>
              <select
                value={filtroConductor}
                onChange={(e) => setFiltroConductor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                {conductores.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">Rendiciones encontradas</p>
              <p className="text-2xl font-bold text-gray-900">{rendicionesFiltradas.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-green-600">${totalMonto.toLocaleString('es-CL')}</p>
            </div>
          </div>

          <button
            onClick={exportarExcel}
            disabled={rendicionesFiltradas.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Exportar a Excel/CSV
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Conductor</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Monto</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rendicionesFiltradas.slice(0, 50).map((r) => {
                  const conductor = conductores.find(c => c.id === r.conductor_id)
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{r.fecha_gasto}</td>
                      <td className="px-4 py-3 text-sm">{conductor?.full_name || conductor?.email || '-'}</td>
                      <td className="px-4 py-3 text-sm">{TIPO_GASTO_LABELS[r.tipo_gasto as TipoGasto]}</td>
                      <td className="px-4 py-3 text-sm font-medium">${r.monto.toLocaleString('es-CL')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          r.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                          r.estado === 'aprobado' ? 'bg-blue-100 text-blue-800' :
                          r.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ESTADO_LABELS[r.estado as EstadoRendicion]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rendicionesFiltradas.length > 50 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              Showing 50 of {rendicionesFiltradas.length} records. Export to see all.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
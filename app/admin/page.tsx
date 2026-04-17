'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { Rendicion, ESTADO_LABELS, EstadoRendicion } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { LogOut, FileText, CheckCircle, XCircle, DollarSign, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function DashboardAdmin() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [rendiciones, setRendiciones] = useState<Rendicion[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchRendiciones()
    }
  }, [user, profile])

  const fetchRendiciones = async () => {
    const { data } = await supabase
      .from('rendiciones')
      .select('*')
      .order('created_at', { ascending: false })
    
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

  if (!profile || profile.role !== 'admin') {
    router.push('/dashboard')
    return null
  }

  const total = rendiciones.length
  const pendiente = rendiciones.filter(r => r.estado === 'pendiente').length
  const aprobado = rendiciones.filter(r => r.estado === 'aprobado').length
  const pagado = rendiciones.filter(r => r.estado === 'pagado').length
  const rechazado = rendiciones.filter(r => r.estado === 'rechazado').length
  const totalMonto = rendiciones.reduce((sum, r) => sum + r.monto, 0)

  const gastosPorTipo = rendiciones.reduce((acc, r) => {
    acc[r.tipo_gasto] = (acc[r.tipo_gasto] || 0) + r.monto
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(gastosPorTipo).map(([name, value]) => ({
    name,
    value: Math.round(value)
  }))

  const gastosPorConductor = rendiciones.reduce((acc, r) => {
    acc[r.conductor_id] = (acc[r.conductor_id] || 0) + r.monto
    return acc
  }, {} as Record<string, number>)

  const barData = Object.entries(gastosPorConductor).slice(0, 5).map(([conductor, monto]) => ({
    conductor: conductor.slice(0, 8),
    monto: Math.round(monto)
  }))

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Admin - Dashboard</h1>
          <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <LogOut className="w-5 h-5" /> Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{pendiente}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagadas</p>
                <p className="text-2xl font-bold text-gray-900">{pagado}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rechazadas</p>
                <p className="text-2xl font-bold text-gray-900">{rechazado}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Total en Gastos</h2>
          <p className="text-3xl font-bold text-green-600">${totalMonto.toLocaleString('es-CL')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Tipo</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${value}`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Conductor</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="conductor" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="monto" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <a
            href="/admin/rendiciones"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition"
          >
            Ver Todas las Rendiciones
          </a>
          <a
            href="/admin/reportes"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar Reportes
          </a>
        </div>
      </main>
    </div>
  )
}
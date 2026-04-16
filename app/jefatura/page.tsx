'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { Rendicion, ESTADO_LABELS, EstadoRendicion, TIPO_GASTO_LABELS, TipoGasto } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { LogOut, FileText, CheckCircle, DollarSign, Plus, Image } from 'lucide-react'
import Link from 'next/link'

export default function DashboardJefatura() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [rendiciones, setRendiciones] = useState<Rendicion[]>([])
  const [misRendiciones, setMisRendiciones] = useState<Rendicion[]>([])
  const [loading, setLoading] = useState(true)
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
  }, [user, profile])

  const fetchRendiciones = async () => {
    const [todas, mias] = await Promise.all([
      supabase.from('rendiciones').select('*').order('created_at', { ascending: false }),
      supabase.from('rendiciones').select('*').eq('conductor_id', user?.id).order('created_at', { ascending: false })
    ])
    setRendiciones(todas.data || [])
    setMisRendiciones(mias.data || [])
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

  if (!profile || profile.role !== 'jefatura') {
    router.push('/dashboard')
    return null
  }

  const total = rendiciones.length
  const pendiente = rendiciones.filter(r => r.estado === 'pendiente').length
  const aprobado = rendiciones.filter(r => r.estado === 'aprobado').length
  const pagado = rendiciones.filter(r => r.estado === 'pagado').length
  const totalMonto = rendiciones.reduce((sum, r) => sum + r.monto, 0)

  const misPendiente = misRendiciones.filter(r => r.estado === 'pendiente').length
  const misTotal = misRendiciones.reduce((sum, r) => sum + r.monto, 0)

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
          <h1 className="text-xl font-bold text-gray-900">Jefatura - Dashboard</h1>
          <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <LogOut className="w-5 h-5" /> Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <p className="text-sm text-gray-500">Bienvenido</p>
          <p className="font-semibold text-gray-900">{profile.full_name || profile.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-purple-600">Mis rendiciones pendientes</p>
            <p className="text-2xl font-bold text-purple-900">{misPendiente}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-purple-600">Mi total gastado</p>
            <p className="text-2xl font-bold text-purple-900">${misTotal.toLocaleString('es-CL')}</p>
          </div>
        </div>

        <Link
          href="/jefatura/nueva"
          className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-4 rounded-xl mb-6 transition"
        >
          <Plus className="w-5 h-5" />
          Nueva Rendición
        </Link>

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
                <p className="text-sm text-gray-500">Aprobados</p>
                <p className="text-2xl font-bold text-gray-900">{aprobado}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagados</p>
                <p className="text-2xl font-bold text-gray-900">{pagado}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Total en Gastos (Todos)</h2>
          <p className="text-3xl font-bold text-green-600">${totalMonto.toLocaleString('es-CL')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Persona</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="conductor" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="monto" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex gap-4">
          <a
            href="/jefatura/rendiciones"
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition"
          >
            Ver Todas las Rendiciones
          </a>
        </div>
      </main>
    </div>
  )
}
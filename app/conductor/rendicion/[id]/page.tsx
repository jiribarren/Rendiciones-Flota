'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter, useParams } from 'next/navigation'
import { Rendicion, TipoGasto, TIPO_GASTO_LABELS, EstadoRendicion, ESTADO_LABELS } from '@/types'
import { Loader2, ArrowLeft, Image, Trash2 } from 'lucide-react'

export default function DetalleRendicionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [rendicion, setRendicion] = useState<Rendicion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showImage, setShowImage] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    tipo_gasto: '' as TipoGasto | '',
    monto: '',
    descripcion: '',
    fecha_gasto: '',
    hora_gasto: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user && params.id) {
      fetchRendicion()
    }
  }, [user, params.id])

  const fetchRendicion = async () => {
    const { data, error } = await supabase
      .from('rendiciones')
      .select('*')
      .eq('id', params.id)
      .eq('conductor_id', user?.id)
      .single()

    if (error || !data) {
      router.push('/dashboard')
      return
    }

    setRendicion(data)
    setFormData({
      tipo_gasto: data.tipo_gasto,
      monto: data.monto.toString(),
      descripcion: data.descripcion || '',
      fecha_gasto: data.fecha_gasto,
      hora_gasto: data.hora_gasto,
    })
    setLoading(false)
  }

  const handleSave = async () => {
    if (!rendicion) return

    setSaving(true)
    const { error } = await supabase
      .from('rendiciones')
      .update({
        tipo_gasto: formData.tipo_gasto,
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion || null,
        fecha_gasto: formData.fecha_gasto,
        hora_gasto: formData.hora_gasto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rendicion.id)

    if (error) {
      alert('Error updating: ' + error.message)
      setSaving(false)
      return
    }

    setEditMode(false)
    fetchRendicion()
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!rendicion || !confirm('¿Estás seguro de eliminar esta rendición?')) return

    setSaving(true)
    
    if (rendicion.imagen_documento) {
      const fileName = rendicion.imagen_documento.split('/').pop()
      if (fileName) {
        await supabase.storage.from('documentos').remove([`${user?.id}/${fileName}`])
      }
    }

    const { error } = await supabase
      .from('rendiciones')
      .delete()
      .eq('id', rendicion.id)

    if (error) {
      alert('Error deleting: ' + error.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!rendicion) return null

  const canEdit = rendicion.estado === 'pendiente'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Detalle de Rendición</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              rendicion.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
              rendicion.estado === 'aprobado' ? 'bg-blue-100 text-blue-800' :
              rendicion.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
              'bg-green-100 text-green-800'
            }`}>
              {ESTADO_LABELS[rendicion.estado as EstadoRendicion]}
            </span>
            {canEdit && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Editar
              </button>
            )}
          </div>
        </div>

        {editMode ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Gasto</label>
              <select
                value={formData.tipo_gasto}
                onChange={(e) => setFormData({ ...formData, tipo_gasto: e.target.value as TipoGasto })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              >
                {Object.entries(TIPO_GASTO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha_gasto}
                  onChange={(e) => setFormData({ ...formData, fecha_gasto: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
                <input
                  type="time"
                  value={formData.hora_gasto}
                  onChange={(e) => setFormData({ ...formData, hora_gasto: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => { setEditMode(false); fetchRendicion(); }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-sm text-gray-500 mb-1">Tipo de Gasto</h3>
              <p className="font-semibold text-gray-900">{TIPO_GASTO_LABELS[rendicion.tipo_gasto as TipoGasto]}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-sm text-gray-500 mb-1">Monto</h3>
              <p className="font-bold text-2xl text-gray-900">${rendicion.monto.toLocaleString('es-CL')}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-sm text-gray-500 mb-1">Descripción</h3>
              <p className="text-gray-900">{rendicion.descripcion || '-'}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-sm text-gray-500 mb-1">Fecha y Hora</h3>
              <p className="text-gray-900">{rendicion.fecha_gasto} a las {rendicion.hora_gasto}</p>
            </div>

            {rendicion.imagen_documento && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm text-gray-500 mb-2">Documento</h3>
                <button
                  onClick={() => setShowImage(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Image className="w-5 h-5" />
                  Ver imagen
                </button>
              </div>
            )}
          </div>
        )}

        {canEdit && !editMode && (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="w-full mt-6 bg-red-50 text-red-600 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 transition"
          >
            <Trash2 className="w-5 h-5" />
            Eliminar Rendición
          </button>
        )}

        {showImage && rendicion.imagen_documento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowImage(false)}>
            <div className="max-w-2xl w-full">
              <img src={rendicion.imagen_documento} alt="Documento" className="w-full h-auto rounded-lg" />
              <button className="absolute top-4 right-4 text-white text-xl">×</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
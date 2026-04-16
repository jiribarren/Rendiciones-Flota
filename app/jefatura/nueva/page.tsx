'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { TipoGasto, TIPO_GASTO_LABELS } from '@/types'
import { Loader2, Upload, ArrowLeft, Camera } from 'lucide-react'

export default function NuevaRendicionJefaturaPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagenUrl, setImagenUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    tipo_gasto: '' as TipoGasto | '',
    monto: '',
    descripcion: '',
    fecha_gasto: new Date().toISOString().split('T')[0],
    hora_gasto: new Date().toTimeString().slice(0, 5),
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(fileName, file)

    if (error) {
      alert('Error uploading image')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName)

    setImagenUrl(publicUrl)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.tipo_gasto || !formData.monto || !formData.fecha_gasto || !formData.hora_gasto) {
      alert('Por favor complete todos los campos requeridos')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('rendiciones').insert({
      conductor_id: user.id,
      tipo_gasto: formData.tipo_gasto,
      monto: parseFloat(formData.monto),
      descripcion: formData.descripcion || null,
      fecha_gasto: formData.fecha_gasto,
      hora_gasto: formData.hora_gasto,
      imagen_documento: imagenUrl,
    })

    if (error) {
      alert('Error al crear rendición: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/jefatura')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile || profile.role !== 'jefatura') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Nueva Rendición - Jefatura</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Gasto *
            </label>
            <select
              value={formData.tipo_gasto}
              onChange={(e) => setFormData({ ...formData, tipo_gasto: e.target.value as TipoGasto })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Seleccionar...</option>
              {Object.entries(TIPO_GASTO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              rows={3}
              placeholder="Descripción adicional..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.fecha_gasto}
                onChange={(e) => setFormData({ ...formData, fecha_gasto: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora *
              </label>
              <input
                type="time"
                value={formData.hora_gasto}
                onChange={(e) => setFormData({ ...formData, hora_gasto: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto del documento
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition">
              {imagenUrl ? (
                <div className="relative">
                  <img src={imagenUrl} alt="Document" className="max-h-48 mx-auto rounded-lg" />
                  <button
                    type="button"
                    onClick={() => setImagenUrl(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2 text-purple-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Subiendo...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <Camera className="w-8 h-8 mb-2" />
                        <span className="text-sm">Toca para tomar foto</span>
                      </div>
                    )}
                  </label>
                </>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Guardar Rendición
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
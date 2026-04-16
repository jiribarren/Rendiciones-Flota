'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { useRouter, useParams } from 'next/navigation'
import { Rendicion, TIPO_GASTO_LABELS, ESTADO_LABELS, EstadoRendicion } from '@/types'
import { ArrowLeft, Image, Check, X, DollarSign, Loader2 } from 'lucide-react'

export default function DetalleRendicionAdmin() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [rendicion, setRendicion] = useState<Rendicion | null>(null)
  const [conductorProfile, setConductorProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showDocImage, setShowDocImage] = useState(false)
  const [showTransImage, setShowTransImage] = useState(false)
  const [uploadingTransfer, setUploadingTransfer] = useState(false)
  const [imagenTransferencia, setImagenTransferencia] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user && profile?.role === 'admin' && params.id) {
      fetchRendicion()
    }
  }, [user, profile, params.id])

  const fetchRendicion = async () => {
    const { data, error } = await supabase
      .from('rendiciones')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      router.push('/admin/rendiciones')
      return
    }

    setRendicion(data)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', data.conductor_id)
      .single()

    setConductorProfile(profileData)
    setImagenTransferencia(data.imagen_transferencia)
    setLoading(false)
  }

  const handleEstado = async (nuevoEstado: EstadoRendicion) => {
    if (!rendicion) return
    setUpdating(true)

    const updateData: any = {
      estado: nuevoEstado,
      updated_at: new Date().toISOString(),
    }

    if (nuevoEstado === 'pagado' && imagenTransferencia) {
      updateData.imagen_transferencia = imagenTransferencia
    }

    const { error } = await supabase
      .from('rendiciones')
      .update(updateData)
      .eq('id', rendicion.id)

    if (error) {
      alert('Error updating: ' + error.message)
      setUpdating(false)
      return
    }

    fetchRendicion()
    setUpdating(false)
  }

  const handleUploadTransferencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !rendicion) return

    setUploadingTransfer(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `transferencias/${rendicion.id}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(fileName, file)

    if (error) {
      alert('Error uploading')
      setUploadingTransfer(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName)

    setImagenTransferencia(publicUrl)
    setUploadingTransfer(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile || profile.role !== 'admin' || !rendicion) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Detalle de Rendición</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500">Conductor</p>
              <p className="font-semibold text-gray-900">{conductorProfile?.full_name || '-'}</p>
              <p className="text-sm text-gray-500">{conductorProfile?.email}</p>
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              rendicion.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
              rendicion.estado === 'aprobado' ? 'bg-blue-100 text-blue-800' :
              rendicion.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
              'bg-green-100 text-green-800'
            }`}>
              {ESTADO_LABELS[rendicion.estado as EstadoRendicion]}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Tipo de Gasto</p>
            <p className="font-semibold text-gray-900">{TIPO_GASTO_LABELS[rendicion.tipo_gasto]}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Monto</p>
            <p className="font-bold text-2xl text-gray-900">${rendicion.monto.toLocaleString('es-CL')}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <p className="text-sm text-gray-500 mb-1">Descripción</p>
          <p className="text-gray-900">{rendicion.descripcion || '-'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <p className="text-sm text-gray-500 mb-2">Fecha y Hora</p>
          <p className="text-gray-900">{rendicion.fecha_gasto} a las {rendicion.hora_gasto}</p>
        </div>

        {rendicion.imagen_documento && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <p className="text-sm text-gray-500 mb-2">Documento Fiscal</p>
            <button
              onClick={() => setShowDocImage(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Image className="w-5 h-5" />
              Ver imagen del documento
            </button>
          </div>
        )}

        {rendicion.estado === 'aprobado' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <p className="text-sm text-gray-500 mb-2">Comprobante de Transferencia</p>
            {imagenTransferencia ? (
              <button
                onClick={() => setShowTransImage(true)}
                className="flex items-center gap-2 text-green-600"
              >
                <Image className="w-5 h-5" />
                Ver imagen de transferencia
              </button>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadTransferencia}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  {uploadingTransfer ? <Loader2 className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />}
                  Subir comprobante de transferencia
                </span>
              </label>
            )}
          </div>
        )}

        {rendicion.imagen_transferencia && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <p className="text-sm text-gray-500 mb-2">Comprobante de Transferencia</p>
            <button
              onClick={() => setShowTransImage(true)}
              className="flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <Image className="w-5 h-5" />
              Ver imagen de transferencia
            </button>
          </div>
        )}

        {rendicion.estado === 'pendiente' && (
          <div className="flex gap-4">
            <button
              onClick={() => handleEstado('aprobado')}
              disabled={updating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Aprobar
            </button>
            <button
              onClick={() => handleEstado('rechazado')}
              disabled={updating}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
              Rechazar
            </button>
          </div>
        )}

        {rendicion.estado === 'aprobado' && (
          <button
            onClick={() => handleEstado('pagado')}
            disabled={updating}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
            Marcar como Pagado
          </button>
        )}

        {showDocImage && rendicion.imagen_documento && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDocImage(false)}>
            <div className="max-w-2xl w-full relative">
              <button className="absolute -top-10 right-0 text-white text-2xl" onClick={() => setShowDocImage(false)}>×</button>
              <img src={rendicion.imagen_documento} alt="Documento" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        )}

        {showTransImage && rendicion.imagen_transferencia && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowTransImage(false)}>
            <div className="max-w-2xl w-full relative">
              <button className="absolute -top-10 right-0 text-white text-2xl" onClick={() => setShowTransImage(false)}>×</button>
              <img src={rendicion.imagen_transferencia} alt="Transferencia" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
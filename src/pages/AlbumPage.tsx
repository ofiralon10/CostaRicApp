import { useState, useRef } from 'react'
import { useLang } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useSharedState } from '../hooks/useSharedState'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'
import { Camera, Image, Plus, Trash2, X } from 'lucide-react'

interface Photo {
  id: string
  url: string
  caption: string
  captionHe: string
  uploadedBy: string
  timestamp: number
}

export default function AlbumPage() {
  const { t } = useLang()
  const { member } = useAuth()
  const [photos, setPhotos] = useSharedState<Photo[]>('album', [])
  const [uploading, setUploading] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [viewPhoto, setViewPhoto] = useState<Photo | null>(null)
  const [captionInput, setCaptionInput] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setShowPicker(false)
    e.target.value = ''
  }

  const uploadPhoto = async () => {
    if (!pendingFile) return
    setUploading(true)
    try {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const blob = await resizeImageToBlob(pendingFile)
      const storageRef = ref(storage, `album/${id}.jpg`)
      await uploadBytes(storageRef, blob)
      const url = await getDownloadURL(storageRef)

      const newPhoto: Photo = {
        id,
        url,
        caption: captionInput,
        captionHe: captionInput,
        uploadedBy: member?.id || 'unknown',
        timestamp: Date.now(),
      }
      setPhotos(prev => [newPhoto, ...prev])
      setPendingFile(null)
      setCaptionInput('')
    } catch (err) {
      console.error('Upload error:', err)
    }
    setUploading(false)
  }

  const deletePhoto = async (photo: Photo) => {
    try {
      const storageRef = ref(storage, `album/${photo.id}.jpg`)
      await deleteObject(storageRef)
    } catch {}
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    setViewPhoto(null)
  }

  return (
    <div className="album-page">
      <h2 className="page-title">{t('📸 אלבום המשפחה', '📸 Family Album')}</h2>
      <p className="album-subtitle">
        {t('הרגעים היפים שלנו מקוסטה ריקה', 'Our beautiful moments from Costa Rica')}
      </p>

      <button className="album-add-btn" onClick={() => setShowPicker(true)}>
        <Plus size={20} />
        {t('הוסף תמונה', 'Add Photo')}
      </button>

      {showPicker && (
        <div className="doc-pick-overlay" onClick={() => setShowPicker(false)}>
          <div className="doc-pick-modal" onClick={e => e.stopPropagation()}>
            <div className="doc-pick-buttons">
              <button className="doc-pick-btn" onClick={() => cameraRef.current?.click()}>
                <Camera size={24} />
                <span>{t('צלם תמונה', 'Take Photo')}</span>
              </button>
              <button className="doc-pick-btn" onClick={() => galleryRef.current?.click()}>
                <Image size={24} />
                <span>{t('העלה מגלריה', 'Upload from Gallery')}</span>
              </button>
            </div>
            <button className="doc-pick-cancel" onClick={() => setShowPicker(false)}>
              {t('ביטול', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        hidden
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        hidden
      />

      {pendingFile && (
        <div className="album-caption-bar">
          <img src={URL.createObjectURL(pendingFile)} className="album-caption-preview" alt="" />
          <input
            className="album-caption-input"
            placeholder={t('הוסף כיתוב...', 'Add caption...')}
            value={captionInput}
            onChange={e => setCaptionInput(e.target.value)}
          />
          <button className="album-upload-btn" onClick={uploadPhoto} disabled={uploading}>
            {uploading ? t('מעלה...', 'Uploading...') : t('העלה', 'Upload')}
          </button>
          <button className="album-cancel-btn" onClick={() => setPendingFile(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {photos.length === 0 && !pendingFile && (
        <div className="album-empty">
          <span className="album-empty-icon">🦜</span>
          <p>{t('עדיין אין תמונות — היו הראשונים להוסיף!', 'No photos yet — be the first to add one!')}</p>
        </div>
      )}

      <div className="album-grid">
        {photos.map(photo => (
          <div key={photo.id} className="album-frame" onClick={() => setViewPhoto(photo)}>
            <div className="album-frame-inner">
              <img src={photo.url} alt={photo.caption} className="album-photo" />
            </div>
            {photo.caption && <p className="album-caption">{photo.caption}</p>}
          </div>
        ))}
      </div>

      {viewPhoto && (
        <div className="album-lightbox" onClick={() => setViewPhoto(null)}>
          <div className="album-lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={viewPhoto.url} alt={viewPhoto.caption} className="album-lightbox-img" />
            {viewPhoto.caption && <p className="album-lightbox-caption">{viewPhoto.caption}</p>}
            <div className="album-lightbox-actions">
              <button className="album-lightbox-delete" onClick={() => deletePhoto(viewPhoto)}>
                <Trash2 size={16} />
                {t('מחק', 'Delete')}
              </button>
              <button className="album-lightbox-close" onClick={() => setViewPhoto(null)}>
                <X size={16} />
                {t('סגור', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

async function resizeImageToBlob(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 1200
      let w = img.width
      let h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = (h / w) * MAX; w = MAX }
        else { w = (w / h) * MAX; h = MAX }
      }
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.8)
    }
    img.src = URL.createObjectURL(file)
  })
}

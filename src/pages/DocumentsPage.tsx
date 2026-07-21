import { useState, useRef } from 'react'
import { useLang } from '../context/LanguageContext'
import { useSharedState } from '../hooks/useSharedState'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'
import { Camera, Image, X, Trash2, Pencil, FileText } from 'lucide-react'

interface DocSlot {
  id: string
  label: string
  labelEn: string
  emoji: string
}

interface DocCategory {
  id: string
  title: string
  titleEn: string
  slots: DocSlot[]
}

interface DocFile {
  id: string
  url: string
  type: 'pdf' | 'image'
  path: string   // storage path, used for deletion
}

const categories: DocCategory[] = [
  {
    id: 'passports',
    title: 'דרכונים',
    titleEn: 'Passports',
    slots: [
      { id: 'passport-ofir', label: 'דרכון — אופיר', labelEn: 'Passport — Ofir', emoji: '🛂' },
      { id: 'passport-merav', label: 'דרכון — מירב', labelEn: 'Passport — Merav', emoji: '🛂' },
      { id: 'passport-maya', label: 'דרכון — מאיה', labelEn: 'Passport — Maya', emoji: '🛂' },
      { id: 'passport-matan', label: 'דרכון — מתן', labelEn: 'Passport — Matan', emoji: '🛂' },
      { id: 'passport-yoav', label: 'דרכון — יואב', labelEn: 'Passport — Yoav', emoji: '🛂' },
    ],
  },
  {
    id: 'insurance',
    title: 'ביטוח נסיעות',
    titleEn: 'Travel Insurance',
    slots: [
      { id: 'insurance-policy', label: 'פוליסת ביטוח', labelEn: 'Insurance Policy', emoji: '🏥' },
      { id: 'insurance-card', label: 'כרטיס ביטוח', labelEn: 'Insurance Card', emoji: '💳' },
    ],
  },
  {
    id: 'flights',
    title: 'טיסות',
    titleEn: 'Flight Tickets',
    slots: [
      { id: 'flight-tlv-mad', label: 'TLV ← MAD (Jul 23)', labelEn: 'TLV → MAD (Jul 23)', emoji: '✈️' },
      { id: 'flight-mad-sjo', label: 'MAD ← SJO (Jul 23)', labelEn: 'MAD → SJO (Jul 23)', emoji: '✈️' },
      { id: 'flight-sjo-mad', label: 'SJO ← MAD (Aug 6)', labelEn: 'SJO → MAD (Aug 6)', emoji: '✈️' },
      { id: 'flight-mad-tlv', label: 'MAD ← TLV (Aug 10)', labelEn: 'MAD → TLV (Aug 10)', emoji: '✈️' },
    ],
  },
  {
    id: 'bookings',
    title: 'אישורי הזמנה',
    titleEn: 'Booking Confirmations',
    slots: [
      { id: 'hotel-hilton1', label: 'Hilton Garden Inn (Jul 23)', labelEn: 'Hilton Garden Inn (Jul 23)', emoji: '🏨' },
      { id: 'hotel-tabacon', label: 'Tabacón Resort', labelEn: 'Tabacón Resort', emoji: '🏨' },
      { id: 'hotel-hideaway', label: 'Hideaway Rio Celeste', labelEn: 'Hideaway Rio Celeste', emoji: '🏨' },
      { id: 'hotel-monteverde', label: 'Monteverde Lodge', labelEn: 'Monteverde Lodge', emoji: '🏨' },
      { id: 'hotel-parador', label: 'Parador Resort', labelEn: 'Parador Resort', emoji: '🏨' },
      { id: 'hotel-cuna', label: 'Cuna del Angel', labelEn: 'Cuna del Angel', emoji: '🏨' },
      { id: 'hotel-trogon', label: 'Trogon Lodge', labelEn: 'Trogon Lodge', emoji: '🏨' },
      { id: 'hotel-hilton2', label: 'Hilton Garden Inn (Aug 5)', labelEn: 'Hilton Garden Inn (Aug 5)', emoji: '🏨' },
      { id: 'hotel-melia', label: 'INNSide Meliá Madrid', labelEn: 'INNSide Meliá Madrid', emoji: '🏨' },
    ],
  },
  {
    id: 'other',
    title: 'מסמכים נוספים',
    titleEn: 'Other',
    slots: [
      { id: 'other-1', label: 'מסמך 1', labelEn: 'Document 1', emoji: '📄' },
      { id: 'other-2', label: 'מסמך 2', labelEn: 'Document 2', emoji: '📄' },
      { id: 'other-3', label: 'מסמך 3', labelEn: 'Document 3', emoji: '📄' },
    ],
  },
]

function resizeImageToBlob(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.7)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function DocumentsPage() {
  const { t } = useLang()
  // Legacy single-file model (kept so previously-uploaded docs still show)
  const [docs, setDocs] = useSharedState<Record<string, string>>('documents', {})
  const [docTypes, setDocTypes] = useSharedState<Record<string, 'pdf' | 'image'>>('document-types', {})
  // New multi-file model: each slot can hold several files
  const [docFiles, setDocFiles] = useSharedState<Record<string, DocFile[]>>('document-files', {})
  const [docNames, setDocNames] = useSharedState<Record<string, string>>('document-names', {})
  const [viewImg, setViewImg] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ slotId: string; file: DocFile } | null>(null)
  const [pickSlot, setPickSlot] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [activeSlot, setActiveSlot] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Merge any legacy single file with the multi-file list for a slot
  const getFiles = (slotId: string): DocFile[] => {
    const list: DocFile[] = []
    if (docs[slotId]) {
      const ext = docTypes[slotId] === 'pdf' ? 'pdf' : 'jpg'
      list.push({
        id: `legacy-${slotId}`,
        url: docs[slotId],
        type: docTypes[slotId] === 'pdf' ? 'pdf' : 'image',
        path: `documents/${slotId}.${ext}`,
      })
    }
    return [...list, ...(docFiles[slotId] || [])]
  }

  const getSlotLabel = (slot: DocSlot) => {
    if (slot.id.startsWith('other-') && docNames[slot.id]) {
      return docNames[slot.id]
    }
    return t(slot.label, slot.labelEn)
  }

  const startEditName = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingName(slotId)
    setEditValue(docNames[slotId] || '')
  }

  const saveName = () => {
    if (editingName) {
      const val = editValue.trim()
      setDocNames(prev => {
        if (!val) {
          const next = { ...prev }
          delete next[editingName]
          return next
        }
        return { ...prev, [editingName]: val }
      })
      setEditingName(null)
    }
  }

  const handlePickCamera = () => {
    if (!pickSlot) return
    setActiveSlot(pickSlot)
    setPickSlot(null)
    setTimeout(() => cameraRef.current?.click(), 50)
  }

  const handlePickGallery = () => {
    if (!pickSlot) return
    setActiveSlot(pickSlot)
    setPickSlot(null)
    setTimeout(() => galleryRef.current?.click(), 50)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeSlot) return
    const slotId = activeSlot
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    setUploading(slotId)
    try {
      const fileId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      let blob: Blob
      let ext: string
      let contentType: string
      if (isPdf) {
        blob = file
        ext = 'pdf'
        contentType = 'application/pdf'
      } else {
        blob = await resizeImageToBlob(file, 1200)
        ext = 'jpg'
        contentType = 'image/jpeg'
      }
      // Each file gets a unique path so a slot can hold many files
      const path = `documents/${slotId}/${fileId}.${ext}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, blob, { contentType })
      const url = await getDownloadURL(storageRef)
      const newFile: DocFile = { id: fileId, url, type: isPdf ? 'pdf' : 'image', path }
      setDocFiles(prev => ({ ...prev, [slotId]: [...(prev[slotId] || []), newFile] }))
    } catch (err) {
      console.error('Upload failed:', err)
    }
    setUploading(null)
    setActiveSlot(null)
    e.target.value = ''
  }

  const handleDelete = async (slotId: string, file: DocFile) => {
    try {
      await deleteObject(ref(storage, file.path))
    } catch { /* file may not exist */ }
    if (file.id.startsWith('legacy-')) {
      setDocs(prev => { const next = { ...prev }; delete next[slotId]; return next })
      setDocTypes(prev => { const next = { ...prev }; delete next[slotId]; return next })
    } else {
      setDocFiles(prev => ({ ...prev, [slotId]: (prev[slotId] || []).filter(f => f.id !== file.id) }))
    }
    setDeleteConfirm(null)
  }

  const openFile = (file: DocFile) => {
    if (file.type === 'pdf') {
      window.open(file.url, '_blank', 'noopener')
    } else {
      setViewImg(file.url)
    }
  }

  const filled = categories.reduce((s, c) => s + c.slots.filter(sl => getFiles(sl.id).length > 0).length, 0)
  const total = categories.reduce((s, c) => s + c.slots.length, 0)

  return (
    <div className="documents-page">
      <h2 className="page-title">{t('📁 כספת מסמכים', '📁 Document Vault')}</h2>

      <div className="doc-progress-bar-wrap">
        <div className="doc-progress-header">
          <span>{t('הועלו', 'Uploaded')}</span>
          <span className="doc-progress-count">{filled}/{total}</span>
        </div>
        <div className="doc-progress-bar">
          <div className="doc-progress-fill" style={{ width: `${total > 0 ? (filled / total) * 100 : 0}%` }} />
        </div>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />

      {categories.map(cat => (
        <div key={cat.id} className="doc-cat">
          <h3 className="doc-cat-title">{t(cat.title, cat.titleEn)}</h3>
          <div className="doc-slots">
            {cat.slots.map(slot => {
              const files = getFiles(slot.id)
              const hasDoc = files.length > 0
              const isUploading = uploading === slot.id
              const labelEl = editingName === slot.id ? (
                <input
                  className="doc-name-input"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={e => { if (e.key === 'Enter') saveName() }}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                  placeholder={t(slot.label, slot.labelEn)}
                />
              ) : (
                <span className="doc-slot-label">
                  {getSlotLabel(slot)}
                  {files.length > 0 && <span className="doc-file-count"> ({files.length})</span>}
                  {slot.id.startsWith('other-') && (
                    <button className="doc-action-btn doc-rename-btn" onClick={e => startEditName(slot.id, e)}><Pencil size={12} /></button>
                  )}
                </span>
              )
              return (
                <div key={slot.id} className={`doc-slot ${hasDoc ? 'filled' : ''}`}>
                  {hasDoc ? (
                    <div className="doc-slot-multi">
                      <div className="doc-slot-info">{labelEl}</div>
                      <div className="doc-file-grid">
                        {files.map(file => (
                          <div key={file.id} className="doc-file-item">
                            {file.type === 'pdf' ? (
                              <button className="doc-file-thumb doc-slot-pdf" onClick={() => openFile(file)}>
                                <FileText size={28} />
                                <span>PDF</span>
                              </button>
                            ) : (
                              <img className="doc-file-thumb" src={file.url} alt={getSlotLabel(slot)} onClick={() => openFile(file)} />
                            )}
                            <button className="doc-file-del" onClick={() => setDeleteConfirm({ slotId: slot.id, file })} aria-label="Delete"><Trash2 size={12} /></button>
                          </div>
                        ))}
                        {isUploading ? (
                          <div className="doc-file-add doc-uploading"><span>⏳</span></div>
                        ) : (
                          <button className="doc-file-add" onClick={() => setPickSlot(slot.id)}>
                            <Camera size={18} />
                            <span>{t('עוד', 'Add')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : isUploading ? (
                    <div className="doc-slot-empty doc-uploading">
                      <span className="doc-slot-emoji">⏳</span>
                      <span className="doc-slot-label">{t('מעלה...', 'Uploading...')}</span>
                    </div>
                  ) : (
                    <button className="doc-slot-empty" onClick={() => setPickSlot(slot.id)}>
                      <span className="doc-slot-emoji">{slot.emoji}</span>
                      {labelEl}
                      <span className="doc-slot-add"><Camera size={16} /> {t('הוסף', 'Add')}</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Source picker modal */}
      {pickSlot && (() => {
        const slot = categories.flatMap(c => c.slots).find(s => s.id === pickSlot)!
        return (
          <div className="sticker-modal-overlay" onClick={() => setPickSlot(null)}>
            <div className="sticker-modal doc-pick-modal" onClick={e => e.stopPropagation()}>
              <h3>{getSlotLabel(slot)}</h3>
              <p className="sticker-modal-day">{t('איך להוסיף את המסמך?', 'How to add the document?')}</p>
              <div className="doc-pick-buttons">
                <button className="doc-pick-btn" onClick={handlePickCamera}>
                  <Camera size={28} />
                  <span>{t('צלם תמונה', 'Take Photo')}</span>
                </button>
                <button className="doc-pick-btn" onClick={handlePickGallery}>
                  <Image size={28} />
                  <span>{t('העלה קובץ (תמונה / PDF)', 'Upload File (Image / PDF)')}</span>
                </button>
              </div>
              <button className="doc-pick-cancel" onClick={() => setPickSlot(null)}>
                {t('ביטול', 'Cancel')}
              </button>
            </div>
          </div>
        )
      })()}

      {/* Full-screen image viewer */}
      {viewImg && (
        <div className="doc-viewer-overlay" onClick={() => setViewImg(null)}>
          <button className="doc-viewer-close"><X size={24} /></button>
          <img className="doc-viewer-img" src={viewImg} alt="Document" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="sticker-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="sticker-modal" onClick={e => e.stopPropagation()}>
            <h3>{t('למחוק מסמך?', 'Delete document?')}</h3>
            <p className="sticker-modal-day">{t('לא ניתן לשחזר', 'This cannot be undone')}</p>
            <div className="sticker-modal-actions">
              <button className="game-btn secondary" onClick={() => setDeleteConfirm(null)}>{t('ביטול', 'Cancel')}</button>
              <button className="game-btn" style={{ background: '#dc2626' }} onClick={() => handleDelete(deleteConfirm.slotId, deleteConfirm.file)}>{t('מחק', 'Delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

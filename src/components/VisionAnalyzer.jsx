// VisionAnalyzer.jsx — Dapper AI Vision Component
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useClaudeVision } from '../hooks/useClaudeVision'
import { ensureBrowserImageFile, isHeicLike } from '../utils/imageFiles.js'

const confidenceColor = (score) => {
  if (score >= 0.85) return { bg: 'rgba(74, 222, 128, 0.12)', text: '#4ade80', label: 'High confidence' }
  if (score >= 0.65) return { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24', label: 'Good confidence' }
  return { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171', label: 'Low confidence — verify' }
}

function GarmentCard({ title, icon, data, onCorrect }) {
  if (!data?.visible) return null
  const conf = confidenceColor(data.confidence || 0)
  const pct = Math.round((data.confidence || 0) * 100)
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(201,168,76,0.15)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.7)',
          }}>{title}</span>
        </div>
        <span style={{
          background: conf.bg,
          color: conf.text,
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 999,
          fontFamily: 'DM Mono, monospace',
          letterSpacing: '0.05em',
        }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: data.colorHex || '#1a2744',
          border: '2px solid rgba(255,255,255,0.12)',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 14,
            fontWeight: 700,
            color: '#f0ede6',
            textTransform: 'capitalize',
            lineHeight: 1.2,
          }}>{data.colorLabel || data.color}</div>
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 11,
            color: 'rgba(240,237,230,0.5)',
            marginTop: 2,
            textTransform: 'capitalize',
          }}>
            {data.patternLabel || data.pattern}
            {data.fabric && ` · ${data.fabric}`}
            {data.collar && ` · ${data.collar} collar`}
            {data.fold && ` · ${data.fold} fold`}
            {data.material && ` · ${data.material}`}
          </div>
        </div>
      </div>
      {data.confidence < 0.8 && (
        <button
          onClick={() => onCorrect && onCorrect(title.toLowerCase())}
          style={{
            background: 'transparent',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 8,
            color: '#C9A84C',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            width: '100%',
            justifyContent: 'center',
            letterSpacing: '0.05em',
          }}
        >
          <span>✏️</span>
          <span>Correct Detection</span>
        </button>
      )}
    </div>
  )
}

// Color families for dropdown
const COLOR_FAMILIES = [
  { label: 'Whites & Creams', colors: ['white', 'ivory', 'cream', 'off-white', 'ecru', 'eggshell', 'chalk'] },
  { label: 'Light Blues', colors: ['light blue', 'sky blue', 'powder blue', 'baby blue', 'pale blue', 'ice blue', 'frost blue', 'periwinkle', 'cornflower', 'alice blue'] },
  { label: 'Blues', colors: ['french blue', 'blue', 'cobalt', 'royal blue', 'electric blue', 'steel blue', 'medium blue', 'true blue'] },
  { label: 'Navy & Indigo', colors: ['navy', 'midnight navy', 'dark navy', 'indigo', 'midnight blue', 'prussian blue', 'dark blue'] },
  { label: 'Light Greys', colors: ['light grey', 'silver', 'pearl', 'ash grey', 'platinum', 'pale grey', 'fog'] },
  { label: 'Greys', colors: ['grey', 'medium grey', 'slate', 'stone', 'pewter', 'battleship grey'] },
  { label: 'Dark Greys & Black', colors: ['charcoal', 'dark charcoal', 'graphite', 'off-black', 'black', 'jet black', 'onyx'] },
  { label: 'Browns & Tans', colors: ['beige', 'tan', 'camel', 'khaki', 'sand', 'taupe', 'mushroom', 'fawn'] },
  { label: 'Dark Browns', colors: ['brown', 'chocolate', 'espresso', 'cognac', 'mahogany', 'walnut', 'chestnut', 'mocha'] },
  { label: 'Greens', colors: ['mint', 'sage', 'light green', 'olive', 'green', 'forest green', 'hunter green', 'emerald', 'bottle green', 'moss'] },
  { label: 'Pinks & Reds', colors: ['blush', 'pink', 'rose', 'dusty rose', 'coral', 'salmon', 'red', 'crimson', 'scarlet'] },
  { label: 'Burgundy & Wine', colors: ['burgundy', 'wine', 'claret', 'oxblood', 'maroon', 'merlot', 'ruby'] },
  { label: 'Purples', colors: ['lavender', 'lilac', 'mauve', 'purple', 'violet', 'plum', 'eggplant', 'amethyst'] },
  { label: 'Yellows & Gold', colors: ['yellow', 'cream yellow', 'butter', 'mustard', 'gold', 'amber', 'honey'] },
  { label: 'Oranges & Rust', colors: ['peach', 'apricot', 'orange', 'rust', 'terracotta', 'burnt orange', 'copper'] },
]

function CorrectionModal({ piece, currentData, onSave, onClose }) {
  const [color, setColor] = useState(currentData?.colorLabel || '')
  const [pattern, setPattern] = useState(currentData?.patternLabel || '')
  const [selectedFamily, setSelectedFamily] = useState(COLOR_FAMILIES[0].label)

  const colorOptions = COLOR_FAMILIES.find(f => f.label === selectedFamily)?.colors || []

  const patternOptions = [
    'solid', 'chalk stripe', 'pin stripe', 'glen plaid', 'herringbone',
    'houndstooth', 'windowpane', 'tweed', 'linen', 'repp stripe',
    'polka dot', 'paisley', 'foulard', 'micro check', 'end-on-end', 'oxford',
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(8,15,30,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#0d1627',
        border: '1px solid rgba(201,168,76,0.25)',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxHeight: '90vh',
        overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>

        <div>
          <h3 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 20,
            color: '#C9A84C',
            margin: 0,
          }}>Correct {piece}</h3>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            color: 'rgba(240,237,230,0.5)',
            margin: '4px 0 0',
          }}>Override what the AI detected</p>
        </div>

        {/* Color family dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
            color: 'rgba(201,168,76,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>Color Family</label>
          <select
            value={selectedFamily}
            onChange={e => { setSelectedFamily(e.target.value); setColor('') }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 8,
              color: '#f0ede6',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              padding: '8px 12px',
              width: '100%',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {COLOR_FAMILIES.map(f => (
              <option key={f.label} value={f.label} style={{ background: '#0d1627' }}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Color chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
            color: 'rgba(201,168,76,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Color {color && <span style={{ color: '#C9A84C', textTransform: 'capitalize' }}>— {color}</span>}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {colorOptions.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                padding: '5px 12px',
                borderRadius: 999,
                border: `1px solid ${color === c ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                background: color === c ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: color === c ? '#C9A84C' : 'rgba(240,237,230,0.6)',
                fontSize: 12,
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Pattern */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
            color: 'rgba(201,168,76,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>Pattern</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {patternOptions.map(p => (
              <button key={p} onClick={() => setPattern(p)} style={{
                padding: '5px 12px',
                borderRadius: 999,
                border: `1px solid ${pattern === p ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                background: pattern === p ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: pattern === p ? '#C9A84C' : 'rgba(240,237,230,0.6)',
                fontSize: 12,
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}>{p}</button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: 'rgba(240,237,230,0.6)',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={() => onSave({ color, pattern })} style={{
            flex: 2, padding: '10px', borderRadius: 10,
            background: 'linear-gradient(135deg, #C9A84C, #a8862e)',
            border: 'none', color: '#080f1e',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
          }}>Save Correction</button>
        </div>
      </div>
    </div>
  )
}

export function VisionAnalyzer({ onAnalysisComplete, mode = 'full', className = '' }) {
  const fileInputRef = useRef(null)
  const { analyzeOutfit, isAnalyzing, error, clearError } = useClaudeVision()
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [correctionTarget, setCorrectionTarget] = useState(null)
  const [preparing, setPreparing] = useState(false)
  const [notice, setNotice] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => () => {
    if (preview?.startsWith?.('blob:')) URL.revokeObjectURL(preview)
  }, [preview])

  const handleFileChange = useCallback(async (e) => {
    const rawFile = e.target.files?.[0]
    if (e.target) e.target.value = ''
    if (!rawFile) return
    const imageLike = rawFile.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(rawFile.name || '')
    if (!imageLike) return
    setPreparing(true)
    setLocalError('')
    setNotice('')
    let file = rawFile
    try {
      file = await ensureBrowserImageFile(rawFile)
    } catch (err) {
      setPreview(null)
      setResult(null)
      setLocalError(err.message || 'Could not prepare this photo.')
      clearError()
      setPreparing(false)
      return
    }
    if (preview?.startsWith?.('blob:')) URL.revokeObjectURL(preview)
    const url = URL.createObjectURL(file)
    setPreview(url)
    setResult(null)
    clearError()
    if (isHeicLike(rawFile) && !isHeicLike(file)) {
      setNotice('HEIC photo converted to JPG for compatibility.')
    }
    const { success, data } = await analyzeOutfit(file)
    if (success && data) {
      setResult(data)
      onAnalysisComplete?.(data)
    }
    setPreparing(false)
  }, [analyzeOutfit, onAnalysisComplete, clearError, preview])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || ''))) {
      const fakeEvent = { target: { files: [file] } }
      handleFileChange(fakeEvent)
    }
  }, [handleFileChange])

  const applyCorrection = useCallback(({ color, pattern }) => {
    if (!correctionTarget || !result) return
    const pieceKey = correctionTarget.toLowerCase() === 'pocket square' ? 'pocketSquare' : correctionTarget.toLowerCase()
    const updated = {
      ...result,
      [pieceKey]: {
        ...result[pieceKey],
        color: color || result[pieceKey]?.color,
        colorLabel: color || result[pieceKey]?.colorLabel,
        pattern: pattern || result[pieceKey]?.pattern,
        patternLabel: pattern || result[pieceKey]?.patternLabel,
        confidence: 1.0,
      },
    }
    setResult(updated)
    onAnalysisComplete?.(updated)
    setCorrectionTarget(null)
  }, [correctionTarget, result, onAnalysisComplete])

  const handleReset = () => {
    if (preview?.startsWith?.('blob:')) URL.revokeObjectURL(preview)
    setPreview(null)
    setResult(null)
    setNotice('')
    setLocalError('')
    setPreparing(false)
    clearError()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const overallConf = result?.overallConfidence || 0
  const confInfo = confidenceColor(overallConf)

  return (
    <>
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {!preview && (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !preparing && fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(201,168,76,0.3)',
              borderRadius: 16,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: preparing ? 'wait' : 'pointer',
              background: 'rgba(201,168,76,0.03)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              opacity: preparing ? 0.7 : 1,
            }}
          >
            <div style={{ fontSize: 40 }}>📸</div>
            <div>
              <div style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 17,
                color: '#f0ede6',
                fontWeight: 700,
                marginBottom: 6,
              }}>{preparing ? 'Preparing your photo' : 'Drop your outfit photo'}</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                color: 'rgba(240,237,230,0.4)',
                lineHeight: 1.5,
              }}>
                {preparing
                  ? 'Converting or optimizing the file for analysis...'
                  : <>Claude AI will identify color, pattern & fabric<br />
                    with expert menswear precision</>}
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #C9A84C, #a8862e)',
              color: '#080f1e',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700,
              fontSize: 12,
              padding: '8px 20px',
              borderRadius: 999,
              letterSpacing: '0.05em',
            }}>{preparing ? 'Preparing…' : 'Choose Photo'}</div>
          </div>
        )}

        {preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
              <img
                src={preview}
                alt="Outfit preview"
                style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
              />
              {(isAnalyzing || preparing) && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(8,15,30,0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                }}>
                  <div style={{
                    width: 48, height: 48,
                    border: '3px solid rgba(201,168,76,0.2)',
                    borderTop: '3px solid #C9A84C',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <div style={{
                    fontFamily: 'Playfair Display, Georgia, serif',
                    fontSize: 14,
                    color: '#C9A84C',
                    fontStyle: 'italic',
                  }}>{preparing ? 'Preparing your photo...' : 'Reading your outfit...'}</div>
                </div>
              )}
              {result && !isAnalyzing && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(8,15,30,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${confInfo.text}40`,
                  borderRadius: 999,
                  padding: '4px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: confInfo.text }} />
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: 11,
                    color: confInfo.text,
                    fontWeight: 600,
                  }}>{Math.round(overallConf * 100)}% confidence</span>
                </div>
              )}
            </div>
            {!isAnalyzing && !preparing && (
              <button onClick={handleReset} style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'rgba(240,237,230,0.5)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                padding: '7px 0',
                cursor: 'pointer',
                width: '100%',
              }}>↩ Change photo</button>
            )}
          </div>
        )}

        {notice && !localError && (
          <div style={{
            background: 'rgba(74,163,255,0.08)',
            border: '1px solid rgba(74,163,255,0.22)',
            borderRadius: 12,
            padding: '12px 14px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            color: '#7dd3fc',
          }}>
            {notice}
          </div>
        )}

        {(localError || error) && (
          <div style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#f87171' }}>
              ⚠️ Detection failed
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'rgba(248,113,113,0.7)', wordBreak: 'break-word' }}>
              {localError || error}
            </div>
            <button onClick={() => { setLocalError(''); clearError() }} style={{
              background: 'transparent',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8,
              color: '#f87171',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 11,
              padding: '6px',
              cursor: 'pointer',
            }}>Dismiss & enter manually</button>
          </div>
        )}

        {result && !isAnalyzing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.15)' }} />
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(201,168,76,0.5)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>AI Detection Results</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.15)' }} />
            </div>

            <GarmentCard title="Suit" icon="🧥" data={result.suit} onCorrect={() => setCorrectionTarget('Suit')} />
            {(mode === 'suit-shirt' || mode === 'full') && (
              <GarmentCard title="Shirt" icon="👔" data={result.shirt} onCorrect={() => setCorrectionTarget('Shirt')} />
            )}
            {mode === 'full' && (
              <>
                <GarmentCard title="Tie" icon="🔵" data={result.tie} onCorrect={() => setCorrectionTarget('Tie')} />
                <GarmentCard title="Pocket Square" icon="🤍" data={result.pocketSquare} onCorrect={() => setCorrectionTarget('Pocket Square')} />
              </>
            )}

            {result.notes && (
              <div style={{
                background: 'rgba(201,168,76,0.05)',
                border: '1px solid rgba(201,168,76,0.1)',
                borderRadius: 10,
                padding: '10px 14px',
              }}>
                <p style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 12,
                  color: 'rgba(240,237,230,0.5)',
                  margin: 0,
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}>💬 {result.notes}</p>
              </div>
            )}

            <button
              onClick={() => onAnalysisComplete?.(result)}
              style={{
                background: 'linear-gradient(135deg, #C9A84C 0%, #a8862e 100%)',
                border: 'none',
                borderRadius: 12,
                color: '#080f1e',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                padding: '14px',
                cursor: 'pointer',
                letterSpacing: '0.04em',
                marginTop: 4,
              }}
            >✓ Confirm & Analyze Outfit</button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          disabled={preparing || isAnalyzing}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {correctionTarget && result && (
        <CorrectionModal
          piece={correctionTarget}
          currentData={result[correctionTarget.toLowerCase() === 'pocket square' ? 'pocketSquare' : correctionTarget.toLowerCase()]}
          onSave={applyCorrection}
          onClose={() => setCorrectionTarget(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

export default VisionAnalyzer

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

type FeedbackType = 'reaction' | 'thankyou' | 'text'

const REACTIONS = ['🎉', '💖', '🥳', '😍', '🌸', '✨']
const CONFETTI = ['🎊', '🎉', '💖', '✨', '🌟', '🥳', '🎈', '💕']

const THANK_YOU_PROMPTS = [
  'Bạn đã làm cho ngày của mình thật đặc biệt…',
  'Tôi thực sự biết ơn vì…',
  'Từ tận đáy lòng, cảm ơn bạn đã…',
  'Bạn không biết đâu, nhưng điều bạn làm đã…',
]

// Floating heart particle
function HeartParticle({ delay, x }: { delay: number; x: number }) {
  const hearts = ['💖', '💕', '💗', '🌸', '✨']
  const h = hearts[Math.floor(Math.random() * hearts.length)]
  return (
    <motion.span
      className="absolute text-lg pointer-events-none select-none"
      style={{ left: `${x}%`, bottom: '-20px' }}
      initial={{ y: 0, opacity: 0, scale: 0.4, rotate: -15 }}
      animate={{
        y: -420,
        opacity: [0, 1, 1, 0],
        scale: [0.4, 1, 0.7],
        rotate: [-15, 10, -10, 15],
        x: [0, 20, -15, 10, 0],
      }}
      transition={{ delay, duration: 4.5, ease: 'easeOut' }}
    >
      {h}
    </motion.span>
  )
}

export default function Page4Feedback() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [type, setType] = useState<FeedbackType>('reaction')
  const [content, setContent] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [punched, setPunched] = useState(false)
  const [promptIndex, setPromptIndex] = useState(0)
  const [heartParticles, setHeartParticles] = useState<{ id: number; x: number; delay: number }[]>([])
  const [isSending, setIsSending] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const particleIdRef = useRef(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Cycle through prompts for thankyou box
  useEffect(() => {
    if (type !== 'thankyou') return
    const interval = setInterval(() => {
      setPromptIndex(i => (i + 1) % THANK_YOU_PROMPTS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [type])

  // Spawn hearts on keystroke for thankyou
  const spawnHeart = () => {
    if (type !== 'thankyou') return
    const id = particleIdRef.current++
    const x = 10 + Math.random() * 80
    setHeartParticles(p => [...p, { id, x, delay: 0 }])
    setTimeout(() => setHeartParticles(p => p.filter(h => h.id !== id)), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    if (type === 'thankyou') {
      setIsSending(true)
      // Spawn a burst of hearts
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          const id = particleIdRef.current++
          const x = 5 + Math.random() * 90
          setHeartParticles(p => [...p, { id, x, delay: 0 }])
          setTimeout(() => setHeartParticles(p => p.filter(h => h.id !== id)), 5500)
        }, i * 80)
      }
      await new Promise(r => setTimeout(r, 1000))
      setIsSending(false)
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/card/feedback', { type, content })
      setSubmitted(true)
    } catch {
      setError('Gửi thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handlePunch = async () => {
    if (punched) return
    setPunched(true)
    try { await api.post('/card/feedback', { type: 'punch', content: '👊' }) } catch { /* silent */ }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (submitted) {
    return (
      <motion.div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, #2d0a4e 0%, #0a0020 40%, #000 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        {CONFETTI.map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-3xl pointer-events-none select-none"
            style={{ left: `${4 + i * 12}%` }}
            initial={{ y: '110vh', opacity: 0, rotate: 0, scale: 0.6 }}
            animate={{ y: '-15vh', opacity: [0, 1, 1, 0], rotate: [0, 180, 360], scale: [0.6, 1.2, 0.8] }}
            transition={{ delay: i * 0.18, duration: 4, repeat: Infinity, repeatDelay: i * 0.25 + 0.5, ease: 'easeInOut' }}
          >
            {emoji}
          </motion.span>
        ))}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${300 + i * 120}px`,
              height: `${300 + i * 120}px`,
              border: `1px solid rgba(244,114,182,${0.25 - i * 0.07})`,
              boxShadow: `0 0 ${20 + i * 15}px rgba(244,114,182,${0.15 - i * 0.04})`
            }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
        <motion.div
          initial={{ scale: 0.4, opacity: 0, y: 80, rotateX: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 16, delay: 0.15 }}
          className="relative z-10 mx-4 max-w-sm w-full rounded-3xl p-8 text-center"
          style={{
            background: 'linear-gradient(145deg, rgba(45,10,78,0.9) 0%, rgba(20,5,40,0.95) 100%)',
            border: '1px solid rgba(244,114,182,0.4)',
            boxShadow: '0 0 60px rgba(244,114,182,0.2), 0 0 120px rgba(103,232,249,0.08), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
          <motion.div className="flex justify-center gap-2 text-xl mb-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            {'✨🌸✨🌸✨'.split('').map((c, i) => (
              <motion.span key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>{c}</motion.span>
            ))}
          </motion.div>
          <motion.p className="text-8xl leading-none mb-5" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.3 }}>🎊</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="text-4xl font-black mb-2 leading-tight"
            style={{ background: 'linear-gradient(135deg, #fde68a 0%, #f472b6 50%, #67e8f9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 12px rgba(244,114,182,0.5))' }}>
            Cảm Ơn Bạn!
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="text-3xl mb-5">💖</motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.6 }} className="h-px mb-5 mx-4"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(244,114,182,0.6), transparent)' }} />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="text-pink-200 text-base mb-2 leading-relaxed">
            Tin nhắn của bạn đã chắp cánh bay đến<br />trái tim người gửi ✨
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-purple-300 text-sm mb-7">
            Chúc bạn một ngày thật tuyệt vời 🌸
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.45 }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 30px rgba(244,114,182,0.5)' }} whileTap={{ scale: 0.94 }}
            onClick={handleLogout}
            className="w-full font-bold py-3 rounded-2xl text-white text-base shadow-xl"
            style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)' }}>
            Đăng xuất 👋
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-lg w-full">
        <h2 className="text-cyan-400 text-3xl font-bold text-center mb-6">💌 Gửi Lời Nhắn</h2>

        {/* Punch Button */}
        <div className="flex flex-col items-center mb-8">
          <motion.button
            onClick={handlePunch}
            disabled={punched}
            whileTap={!punched ? { x: [-12, 12, -8, 8, 0], scale: 0.8, transition: { duration: 0.35 } } : {}}
            whileHover={!punched ? { scale: 1.12 } : {}}
            className="text-[7rem] leading-none select-none focus:outline-none cursor-pointer disabled:cursor-default"
            aria-label="Nút đấm"
          >
            {punched ? '😢' : '👊'}
          </motion.button>
          <AnimatePresence mode="wait">
            {punched ? (
              <motion.p key="cry" initial={{ opacity: 0, y: -8, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="mt-3 text-pink-400 text-lg font-semibold text-center">
                Huhu, sao bạn đấm mình 😢
              </motion.p>
            ) : (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 text-gray-500 text-sm">
                (thử đấm xem sao ☝️)
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl flex flex-col gap-5 overflow-hidden">
          {/* Tab selector */}
          <div className="flex gap-2 bg-gray-900 rounded-2xl p-2">
            {(['reaction', 'thankyou', 'text'] as FeedbackType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setContent(''); setCharCount(0) }}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  type === t
                    ? t === 'thankyou'
                      ? 'text-white shadow-lg'
                      : 'bg-cyan-500 text-black shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={type === t && t === 'thankyou' ? {
                  background: 'linear-gradient(135deg, #be185d, #7c3aed, #0e7490)',
                  boxShadow: '0 0 20px rgba(244,114,182,0.4)'
                } : {}}
              >
                {t === 'reaction' ? '😊 Biểu cảm' : t === 'thankyou' ? '💖 Cảm ơn' : '✍️ Lời nhắn'}
              </button>
            ))}
          </div>

          {/* Content area */}
          <AnimatePresence mode="wait">
            {type === 'reaction' && (
              <motion.div
                key="reaction"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-gray-900 rounded-2xl p-6"
              >
                <div className="grid grid-cols-6 gap-3">
                  {REACTIONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setContent(r)}
                      className={`text-3xl rounded-xl py-2 transition ${content === r ? 'ring-2 ring-cyan-400 bg-gray-700' : 'hover:bg-gray-700'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {type === 'thankyou' && (
              <motion.div
                key="thankyou"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
                className="relative overflow-hidden rounded-3xl"
                style={{
                  background: 'linear-gradient(145deg, #1a0530 0%, #0d0520 60%, #0a0015 100%)',
                  border: '1px solid rgba(244,114,182,0.3)',
                  boxShadow: '0 0 40px rgba(190,24,93,0.15), inset 0 1px 0 rgba(255,255,255,0.04)'
                }}
              >
                {/* Ambient glow orbs */}
                <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                <div className="absolute bottom-0 right-1/4 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(16px)' }} />

                {/* Floating heart particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {heartParticles.map(p => (
                    <HeartParticle key={p.id} delay={p.delay} x={p.x} />
                  ))}
                </div>

                {/* Header */}
                <div className="px-6 pt-6 pb-3 flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="text-2xl"
                  >
                    💌
                  </motion.div>
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold"
                      style={{ color: 'rgba(244,114,182,0.7)', letterSpacing: '0.18em' }}>
                      Thư Cảm Ơn
                    </p>
                    <motion.p
                      key={promptIndex}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="text-xs text-purple-300 italic"
                    >
                      {THANK_YOU_PROMPTS[promptIndex]}
                    </motion.p>
                  </div>
                </div>

                {/* Decorative divider */}
                <div className="mx-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(244,114,182,0.4), rgba(124,58,237,0.4), transparent)' }} />

                {/* Textarea */}
                <div className="relative px-6 py-4">
                  {/* Paper lines effect */}
                  <div className="absolute inset-x-6 inset-y-4 pointer-events-none" style={{ opacity: 0.04 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-full h-px bg-pink-300 mb-7" />
                    ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    rows={5}
                    placeholder="Nhap di, nhap di a…"
                    value={content}
                    onChange={e => {
                      setContent(e.target.value)
                      setCharCount(e.target.value.length)
                      if (Math.random() > 0.6) spawnHeart()
                    }}
                    required
                    maxLength={500}
                    className="relative w-full bg-transparent resize-none outline-none text-base leading-7"
                    style={{
                      color: '#fdf2f8',
                      caretColor: '#f472b6',
                      fontFamily: '"Georgia", "Times New Roman", serif',
                      fontStyle: 'italic',
                      letterSpacing: '0.02em',
                      textShadow: '0 0 8px rgba(244,114,182,0.2)',
                      zIndex: 1,
                    }}
                  />

                  {/* Char counter */}
                  <div className="flex justify-between items-center mt-1">
                    <motion.div
                      animate={{ opacity: charCount > 0 ? 1 : 0 }}
                      className="flex gap-1"
                    >
                      {['💕', '🌸', '✨'].map((e, i) => (
                        <motion.span
                          key={i}
                          className="text-xs"
                          animate={{ opacity: charCount > i * 80 ? 1 : 0.2, scale: charCount > i * 80 ? 1 : 0.7 }}
                          transition={{ duration: 0.3 }}
                        >
                          {e}
                        </motion.span>
                      ))}
                    </motion.div>
                    <span className="text-xs" style={{ color: 'rgba(244,114,182,0.4)' }}>
                      {charCount}/500
                    </span>
                  </div>
                </div>

                {/* Send button — special for thankyou */}
                <div className="px-6 pb-6">
                  <motion.button
                    type="submit"
                    disabled={loading || !content.trim()}
                    whileHover={content.trim() ? { scale: 1.02, boxShadow: '0 0 40px rgba(244,114,182,0.5), 0 0 80px rgba(124,58,237,0.3)' } : {}}
                    whileTap={content.trim() ? { scale: 0.97 } : {}}
                    className="w-full relative overflow-hidden font-bold py-3.5 rounded-2xl text-white text-base transition-all duration-300 disabled:opacity-40"
                    style={{
                      background: 'linear-gradient(135deg, #be185d 0%, #7c3aed 50%, #0e7490 100%)',
                      boxShadow: content.trim() ? '0 0 20px rgba(190,24,93,0.3), 0 4px 24px rgba(0,0,0,0.4)' : 'none',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {/* Shimmer effect */}
                    {content.trim() && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)' }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                      />
                    )}
                    <AnimatePresence mode="wait">
                      {isSending ? (
                        <motion.span key="sending" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}>💌</motion.span>
                          Đang bay đến trái tim…
                        </motion.span>
                      ) : loading ? (
                        <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Đang gửi…</motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                          Gửi Lời Cảm Ơn <span>💖</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {type === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-4"
              >
                <textarea
                  rows={4}
                  placeholder="Gửi mình bất cứ điều gì…"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                  maxLength={500}
                  className="bg-gray-800 text-white rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {loading ? 'Đang gửi…' : 'Gửi 💌'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shared error + submit for reaction tab */}
          {type === 'reaction' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 rounded-2xl px-6 pb-6 -mt-3">
              {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {loading ? 'Đang gửi…' : 'Gửi 💌'}
              </button>
            </motion.div>
          )}

          {error && type !== 'reaction' && <p className="text-red-400 text-sm text-center">{error}</p>}
        </form>
      </motion.div>
    </motion.div>
  )
}
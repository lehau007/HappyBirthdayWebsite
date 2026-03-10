import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/axios'

const LINE_COLORS = [
  'linear-gradient(90deg, #fde68a, #fbbf24)',
  'linear-gradient(90deg, #f9a8d4, #f472b6)',
  'linear-gradient(90deg, #a5f3fc, #67e8f9)',
  'linear-gradient(90deg, #bbf7d0, #34d399)',
  'linear-gradient(90deg, #ddd6fe, #a78bfa)',
  'linear-gradient(90deg, #fed7aa, #fb923c)',
  'linear-gradient(90deg, #fde68a, #f472b6)',
]
const TOP_ICONS = ['🎂', '🎉', '💖', '🎂', '🎉']
const BOT_ICONS = ['🕯', '✨', '🌸', '✨', '🕯']

export default function Page3Poem() {
  const navigate = useNavigate()
  const [poem, setPoem] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/card/poem')
      .then(r => setPoem(r.data.poem_text))
      .catch(() => setError('Could not load your poem. Please try again.'))
  }, [])

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0f0a2a 0%, #000 70%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="max-w-xl w-full text-center"
      >
        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-3xl font-black mb-8 tracking-wide"
          style={{ background: 'linear-gradient(135deg, #fde68a, #f472b6, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          ✨ Bài Thơ Dành Riêng Cho Bạn ✨
        </motion.h2>

        {error && <p className="text-red-400 mb-6">Không thể tải bài thơ. Vui lòng thử lại.</p>}

        {poem ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1.0 }}
            className="rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a0533 0%, #0a1628 50%, #001a2c 100%)',
              border: '1px solid rgba(103,232,249,0.2)',
              boxShadow: '0 0 40px rgba(103,232,249,0.08), 0 0 80px rgba(244,114,182,0.05)'
            }}
          >
            {/* Glow orbs */}
            <div
              className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ background: '#f472b6', transform: 'translate(-50%,-50%)' }}
            />
            <div
              className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ background: '#67e8f9', transform: 'translate(50%,50%)' }}
            />

            {/* Top icon row */}
            <div className="flex justify-center gap-3 text-2xl mb-5">
              {TOP_ICONS.map((ic, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  {ic}
                </motion.span>
              ))}
            </div>

            {/* Poem lines — each fades in with its own color */}
            <div className="flex flex-col gap-2 text-left">
              {poem.split('\n').map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.18, duration: 0.7 }}
                  className="text-lg leading-relaxed font-medium"
                  style={{
                    background: LINE_COLORS[i % LINE_COLORS.length],
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 4px rgba(253,230,138,0.25))'
                  }}
                >
                  {line || '\u00a0'}
                </motion.p>
              ))}
            </div>

            {/* Bottom icon row */}
            <div className="flex justify-center gap-3 text-2xl mt-5">
              {BOT_ICONS.map((ic, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                >
                  {ic}
                </motion.span>
              ))}
            </div>
          </motion.div>
        ) : !error ? (
          <p className="text-gray-400 animate-pulse">Đang tải bài thơ…</p>
        ) : null}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={() => navigate('/page4')}
          disabled={!poem}
          className="mt-10 font-semibold px-8 py-3 rounded-full text-lg transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed text-black"
          style={{ background: 'linear-gradient(135deg, #f472b6, #67e8f9)' }}
        >
          Tiếp tục →
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

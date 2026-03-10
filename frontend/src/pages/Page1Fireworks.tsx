import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fireworks } from '@fireworks-js/react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Page1Fireworks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fwRef = useRef(null)

  return (
    <motion.div
      className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Full-screen fireworks */}
      <Fireworks
        ref={fwRef}
        options={{ opacity: 0.5 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Overlay content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative z-10 text-center px-6"
      >
        <h1 className="text-white text-4xl md:text-6xl font-bold drop-shadow-lg">
          🎉 Chúc mừng sinh nhật, {user?.username}! 🎉
        </h1>
        <p className="text-cyan-300 mt-4 text-lg">
          Một điều bất ngờ đang chờ bạn…
        </p>

        <button
          onClick={() => navigate('/page2')}
          className="mt-10 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-3 rounded-full text-lg transition shadow-lg"
        >
          Tiếp tục →
        </button>
      </motion.div>
    </motion.div>
  )
}

import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import styles from '../styles/flowers.module.css'

export default function Page2Flowers() {
  const navigate = useNavigate()
  const sceneRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  // Mirror the original main.js: start animations after 1 s
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1000)
    return () => clearTimeout(t)
  }, [])

  // Resolve one or more CSS-module class names into a space-separated string (MAJ-003)
  const s = (...names: string[]) => names.map(n => styles[n]).filter(Boolean).join(' ')

  const sceneClass = [styles['flower-scene'], !loaded && styles['not-loaded']].filter(Boolean).join(' ')

  return (
    <motion.div
      className={sceneClass}
      ref={sceneRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={s('night')} />

      <div className={s('flowers')}>
        {/* Flower 1 */}
        <div className={s('flower', 'flower--1')}>
          <div className={s('flower__leafs', 'flower__leafs--1')}>
            <div className={s('flower__leaf', 'flower__leaf--1')} />
            <div className={s('flower__leaf', 'flower__leaf--2')} />
            <div className={s('flower__leaf', 'flower__leaf--3')} />
            <div className={s('flower__leaf', 'flower__leaf--4')} />
            <div className={s('flower__white-circle')} />
            {[1,2,3,4,5,6,7,8].map(n => <div key={n} className={s('flower__light', `flower__light--${n}`)} />)}
          </div>
          <div className={s('flower__line')}>
            {[1,2,3,4,5,6].map(n => <div key={n} className={s('flower__line__leaf', `flower__line__leaf--${n}`)} />)}
          </div>
        </div>

        {/* Flower 2 */}
        <div className={s('flower', 'flower--2')}>
          <div className={s('flower__leafs', 'flower__leafs--2')}>
            <div className={s('flower__leaf', 'flower__leaf--1')} />
            <div className={s('flower__leaf', 'flower__leaf--2')} />
            <div className={s('flower__leaf', 'flower__leaf--3')} />
            <div className={s('flower__leaf', 'flower__leaf--4')} />
            <div className={s('flower__white-circle')} />
            {[1,2,3,4,5,6,7,8].map(n => <div key={n} className={s('flower__light', `flower__light--${n}`)} />)}
          </div>
          <div className={s('flower__line')}>
            {[1,2,3,4].map(n => <div key={n} className={s('flower__line__leaf', `flower__line__leaf--${n}`)} />)}
          </div>
        </div>

        {/* Flower 3 */}
        <div className={s('flower', 'flower--3')}>
          <div className={s('flower__leafs', 'flower__leafs--3')}>
            <div className={s('flower__leaf', 'flower__leaf--1')} />
            <div className={s('flower__leaf', 'flower__leaf--2')} />
            <div className={s('flower__leaf', 'flower__leaf--3')} />
            <div className={s('flower__leaf', 'flower__leaf--4')} />
            <div className={s('flower__white-circle')} />
            {[1,2,3,4,5,6,7,8].map(n => <div key={n} className={s('flower__light', `flower__light--${n}`)} />)}
          </div>
          <div className={s('flower__line')}>
            {[1,2,3,4].map(n => <div key={n} className={s('flower__line__leaf', `flower__line__leaf--${n}`)} />)}
          </div>
        </div>

        {/* Grass & foliage */}
        <div className={s('grow-ans')} style={{ '--d': '1.2s' } as React.CSSProperties}>
          <div className={s('flower__g-long')}>
            <div className={s('flower__g-long__top')} />
            <div className={s('flower__g-long__bottom')} />
          </div>
        </div>

        <div className={s('growing-grass')}>
          <div className={s('flower__grass', 'flower__grass--1')}>
            <div className={s('flower__grass--top')} />
            <div className={s('flower__grass--bottom')} />
            {[1,2,3,4,5,6,7,8].map(n => <div key={n} className={s('flower__grass__leaf', `flower__grass__leaf--${n}`)} />)}
            <div className={s('flower__grass__overlay')} />
          </div>
        </div>

        <div className={s('growing-grass')}>
          <div className={s('flower__grass', 'flower__grass--2')}>
            <div className={s('flower__grass--top')} />
            <div className={s('flower__grass--bottom')} />
            {[1,2,3,4].map(n => <div key={n} className={s('flower__grass__leaf', `flower__grass__leaf--${n}`)} />)}
            <div className={s('flower__grass__overlay')} />
          </div>
        </div>

        <div className={s('grow-ans')} style={{ '--d': '2.4s' } as React.CSSProperties}>
          <div className={s('flower__g-right', 'flower__g-right--1')}><div className={s('leaf')} /></div>
        </div>
        <div className={s('grow-ans')} style={{ '--d': '2.8s' } as React.CSSProperties}>
          <div className={s('flower__g-right', 'flower__g-right--2')}><div className={s('leaf')} /></div>
        </div>

        <div className={s('grow-ans')} style={{ '--d': '2.8s' } as React.CSSProperties}>
          <div className={s('flower__g-front')}>
            {[1,2,3,4,5,6,7,8].map(n => (
              <div key={n} className={s('flower__g-front__leaf-wrapper', `flower__g-front__leaf-wrapper--${n}`)}>
                <div className={s('flower__g-front__leaf')} />
              </div>
            ))}
            <div className={s('flower__g-front__line')} />
          </div>
        </div>

        <div className={s('grow-ans')} style={{ '--d': '3.2s' } as React.CSSProperties}>
          <div className={s('flower__g-fr')}>
            <div className={s('leaf')} />
            {[1,2,3,4,5,6,7,8].map(n => <div key={n} className={s('flower__g-fr__leaf', `flower__g-fr__leaf--${n}`)} />)}
          </div>
        </div>

        {/* Long grass groups */}
        {[
          { cls: 'long-g--0', delays: ['3s','2.2s','3.4s','3.6s'] },
          { cls: 'long-g--1', delays: ['3.6s','3.8s','4s','4.2s'] },
          { cls: 'long-g--2', delays: ['4s','4.2s','4.4s','4.6s'] },
          { cls: 'long-g--3', delays: ['4s','4.2s','3s','3.6s'] },
          { cls: 'long-g--4', delays: ['4s','4.2s','3s','3.6s'] },
          { cls: 'long-g--5', delays: ['4s','4.2s','3s','3.6s'] },
          { cls: 'long-g--6', delays: ['4.2s','4.4s','4.6s','4.8s'] },
          { cls: 'long-g--7', delays: ['3s','3.2s','3.5s','3.6s'] },
        ].map(({ cls, delays }) => (
          <div key={cls} className={s('long-g', cls)}>
            {delays.map((d, i) => (
              <div key={i} className={s('grow-ans')} style={{ '--d': d } as React.CSSProperties}>
                <div className={s('leaf', `leaf--${i}`)} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Overlay navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1.5 }}
        className="fixed bottom-10 right-10 z-50"
      >
        <button
          onClick={() => navigate('/page3')}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3 rounded-full text-lg shadow-xl transition"
        >
          Tiếp tục →
        </button>
      </motion.div>
    </motion.div>
  )
}

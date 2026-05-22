'use client'

import { useState, forwardRef } from 'react'
import { motion } from 'framer-motion'

const spring = { type: 'spring', mass: 0.5, stiffness: 380, damping: 26 } as const

interface MotionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

export const MotionTextarea = forwardRef<HTMLTextAreaElement, MotionTextareaProps>(
  ({ hasError = false, ...props }, ref) => {
    const [focused, setFocused] = useState(false)

    return (
      <motion.div
        layout
        animate={{
          scale:     focused ? 1.012 : 1,
          boxShadow: focused
            ? hasError
              ? '0 0 0 3px rgba(239,68,68,0.22), 0 2px 8px rgba(239,68,68,0.10)'
              : '0 0 0 3px rgba(59,130,246,0.22), 0 2px 8px rgba(59,130,246,0.08)'
            : '0 0 0 0px transparent, 0 1px 3px rgba(0,0,0,0.06)',
        }}
        transition={spring}
        style={{ borderRadius: 6 }}
      >
        <textarea
          ref={ref}
          {...props}
          onFocus={e  => { setFocused(true);  props.onFocus?.(e)  }}
          onBlur={e   => { setFocused(false); props.onBlur?.(e)   }}
          className={[
            'w-full px-3 py-2 text-sm rounded border transition-colors duration-150',
            'focus:outline-none text-gray-900 bg-white resize-none',
            hasError  ? 'border-red-400 bg-red-50/40'
            : focused ? 'border-blue-400'
            :           'border-gray-300',
            props.className ?? '',
          ].join(' ')}
        />
      </motion.div>
    )
  }
)
MotionTextarea.displayName = 'MotionTextarea'

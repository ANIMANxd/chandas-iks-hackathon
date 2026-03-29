'use client'

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react'

export interface ToastHandle {
  show: (msg: string) => void
}

const Toast = forwardRef<ToastHandle>((_, ref) => {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useImperativeHandle(ref, () => ({
    show(msg: string) {
      setMessage(msg)
      setVisible(true)
      if (timer) clearTimeout(timer)
      const t = setTimeout(() => setVisible(false), 2600)
      setTimer(t)
    },
  }))

  return (
    <div className={`toast${visible ? ' show' : ''}`}>
      {message}
    </div>
  )
})

Toast.displayName = 'Toast'
export default Toast

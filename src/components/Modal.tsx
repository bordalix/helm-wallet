import { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: (arg0: any) => void
  children: ReactNode
}

function Modal({ open, onClose, children }: ModalProps) {
  const backdropClass = `fixed inset-0 flex justify-center items-center ${open ? 'visible bg-black/20' : 'invisible'}`
  const modalClass = `bg-white rounded-xl shadow p-6 transition-all ${
    open ? 'scale-100 opacity-100' : 'scale-125 opacity-0'
  }`
  return (
    <div onClick={onClose} className={backdropClass}>
      <div onClick={(e) => e.stopPropagation()} className={modalClass}>
        {children}
      </div>
    </div>
  )
}

export default Modal

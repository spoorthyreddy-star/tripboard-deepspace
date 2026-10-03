import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader as DHeader,
  DialogTitle as DTitle,
  DialogDescription as DDescription,
  DialogFooter as DFooter,
} from './Dialog'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export function Modal({
  open,
  onClose,
  children,
  size = 'md',
  className,
  ...props
}) {
  const sizes = {
    sm: 'max-w-[calc(100vw-2rem)] sm:max-w-sm',
    md: 'max-w-[calc(100vw-2rem)] sm:max-w-lg',
    lg: 'max-w-[calc(100vw-2rem)] sm:max-w-2xl',
    xl: 'max-w-[calc(100vw-2rem)] sm:max-w-4xl',
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent
        aria-describedby={undefined}
        className={cn(sizes[size] || sizes.md, 'flex flex-col max-h-[85vh]', className)}
        {...props}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

function ModalHeader({ children, className = '' }) {
  return (
    <DHeader className={className}>
      {children}
    </DHeader>
  )
}

function ModalTitle({ children, className = '' }) {
  return (
    <DTitle className={cn('min-w-0 truncate', className)}>
      {children}
    </DTitle>
  )
}

function ModalDescription({ children, className = '' }) {
  return (
    <DDescription className={className}>
      {children}
    </DDescription>
  )
}

function ModalBody({ children, className = '' }) {
  return (
    <div className={cn('flex-1 overflow-y-auto -mx-1 px-1 py-4 break-words', className)}>
      {children}
    </div>
  )
}

function ModalFooter({ children, className = '' }) {
  return (
    <DFooter className={className}>
      {children}
    </DFooter>
  )
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
        {description && <Modal.Description>{description}</Modal.Description>}
      </Modal.Header>
      <Modal.Footer>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

Modal.Header = ModalHeader
Modal.Title = ModalTitle
Modal.Description = ModalDescription
Modal.Body = ModalBody
Modal.Footer = ModalFooter

export default Modal

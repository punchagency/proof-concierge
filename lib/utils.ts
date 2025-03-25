import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Toast function with blue styling for the app
type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  id?: string
}

export function blueToast(
  message: string, 
  options?: ToastOptions,
  type: ToastType = 'default'
) {
  const { description, action, duration, id } = options || {}
  
  switch (type) {
    case 'success':
      return toast.success(message, { description, action, duration, id })
    case 'error':
      return toast.error(message, { description, action, duration, id })
    case 'warning':
      return toast.warning(message, { description, action, duration, id })
    case 'info':
      return toast.info(message, { description, action, duration, id })
    default:
      return toast(message, { description, action, duration, id })
  }
}

import React from 'react'
import { Wifi, RefreshCw, AlertCircle } from 'lucide-react'

export default function RealtimeIndicator({ status = 'ready' }) {
  const isReady = status === 'ready'
  const isLoading = status === 'loading'
  const isError = status === 'error'

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium backdrop-blur-sm select-none">
      <span className="relative flex h-2 w-2 shrink-0">
        {isReady && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isReady ? 'bg-emerald-500' : isLoading ? 'bg-amber-400' : 'bg-red-400'
          }`}
        />
      </span>
      <span className="flex items-center gap-1.5">
        <Wifi className="w-3.5 h-3.5 shrink-0" />
        <span>
          {isReady
            ? 'Live Sync'
            : isLoading
            ? 'Syncing with DeepSpace DO...'
            : 'Reconnecting sync...'}
        </span>
      </span>
    </div>
  )
}

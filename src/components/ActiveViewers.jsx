import React from 'react'
import { Eye, Users } from 'lucide-react'

export default function ActiveViewers({ peers = [], connected = true, totalViewers }) {
  const count = typeof totalViewers === 'number' ? totalViewers : peers.length + 1

  return (
    <div
      className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-card/80 border border-border/80 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md select-none transition-all"
      title={`${count} active ${count === 1 ? 'tab/viewer' : 'tabs/viewers'} on this itinerary`}
    >
      <span className="flex items-center gap-1.5 font-medium text-foreground">
        <span className="relative flex h-2 w-2">
          {connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              connected ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
          />
        </span>
        <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>{count === 1 ? '1 active viewer' : `${count} active viewers`}</span>
      </span>

      {peers.length > 0 && (
        <div className="flex -space-x-1.5 overflow-hidden pl-1 items-center">
          {peers.slice(0, 4).map((peer, idx) => (
            <div
              key={peer.userId || idx}
              title={peer.userName || 'Collaborator'}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary ring-1 ring-background"
            >
              {(peer.userName?.[0] || 'C').toUpperCase()}
            </div>
          ))}
          {peers.length > 4 && (
            <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground ring-1 ring-background">
              +{peers.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

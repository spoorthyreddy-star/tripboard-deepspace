import { useState, useEffect, useRef } from 'react'
import { usePresenceRoom } from 'deepspace'

/**
 * Hook combining DeepSpace's PresenceRoom with local BroadcastChannel tracking
 * to ensure that multiple tabs opened on the same machine or across multiple screens
 * correctly count every active viewer tab.
 */
export function useTabAwarePresence(tripId) {
  const presence = usePresenceRoom(tripId ? `trip:${tripId}` : 'lobby')
  const { peers, connected, updateState } = presence

  const [localTabCount, setLocalTabCount] = useState(1)
  const tabIdRef = useRef(null)

  if (!tabIdRef.current) {
    tabIdRef.current = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
  }

  useEffect(() => {
    if (!tripId || typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return
    }

    const channelName = `tripboard_presence_room_${tripId}`
    let channel
    try {
      channel = new BroadcastChannel(channelName)
    } catch {
      return
    }

    // Map of tabId -> lastSeenTimestamp
    const tabsMap = new Map()
    tabsMap.set(tabIdRef.current, Date.now())

    const updateCount = () => {
      const now = Date.now()
      // Clean up stale tabs that haven't heartbeated in 5s
      for (const [id, lastSeen] of tabsMap.entries()) {
        if (id !== tabIdRef.current && now - lastSeen > 5000) {
          tabsMap.delete(id)
        }
      }
      setLocalTabCount(Math.max(1, tabsMap.size))
    }

    const handleMessage = (event) => {
      const { type, tabId } = event.data || {}
      if (!tabId || tabId === tabIdRef.current) return

      const now = Date.now()
      if (type === 'PING') {
        tabsMap.set(tabId, now)
        updateCount()
        // Reply with PONG so the newly opened tab knows about us
        channel.postMessage({ type: 'PONG', tabId: tabIdRef.current })
      } else if (type === 'PONG' || type === 'HEARTBEAT') {
        tabsMap.set(tabId, now)
        updateCount()
      } else if (type === 'LEAVE') {
        tabsMap.delete(tabId)
        updateCount()
      }
    }

    channel.addEventListener('message', handleMessage)

    // Announce our arrival
    channel.postMessage({ type: 'PING', tabId: tabIdRef.current })

    // Periodic heartbeat every 2s
    const heartbeatTimer = setInterval(() => {
      channel.postMessage({ type: 'HEARTBEAT', tabId: tabIdRef.current })
      updateCount()
    }, 2000)

    const handleUnload = () => {
      try {
        channel.postMessage({ type: 'LEAVE', tabId: tabIdRef.current })
      } catch {
        // Ignore if channel is closing
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)

    return () => {
      handleUnload()
      clearInterval(heartbeatTimer)
      channel.removeEventListener('message', handleMessage)
      channel.close()
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('pagehide', handleUnload)
    }
  }, [tripId])

  // Sync our local tab count to DeepSpace's PresenceRoom so remote peers receive it
  useEffect(() => {
    if (connected && typeof updateState === 'function') {
      updateState({ tabCount: localTabCount })
    }
  }, [connected, localTabCount, updateState])

  // Compute remote tabs count from remote peers
  const remoteTabsCount = (peers || []).reduce((sum, peer) => {
    const peerTabs = Number(peer.state?.tabCount) || 1
    return sum + peerTabs
  }, 0)

  // Total viewers = local tabs + remote tabs
  const totalViewers = localTabCount + remoteTabsCount

  return {
    peers,
    connected,
    localTabCount,
    totalViewers,
    updateState,
  }
}

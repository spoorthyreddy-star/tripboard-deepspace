import React, { useState } from 'react'
import { X, Calendar, AlignLeft, Sparkles, Loader2, MapPin, Compass } from 'lucide-react'
import DestinationSearchInput, { resolveDestination, formatCoords } from './DestinationSearchInput'

const COLOR_OPTIONS = [
  { id: 'sky', label: 'Sky Blue', bg: 'bg-sky-500', border: 'border-sky-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', border: 'border-indigo-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500', border: 'border-amber-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500', border: 'border-rose-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500' },
]

export default function CreateTripModal({ isOpen, onClose, onCreate }) {
  const [destination, setDestination] = useState('')
  const [locationDetails, setLocationDetails] = useState({
    city: '',
    country: '',
    latitude: null,
    longitude: null,
  })
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [coverColor, setCoverColor] = useState('sky')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleDestinationChange = (val, resolved) => {
    setDestination(val)
    if (resolved) {
      setLocationDetails({
        city: resolved.city || '',
        country: resolved.country || '',
        latitude: typeof resolved.latitude === 'number' ? resolved.latitude : null,
        longitude: typeof resolved.longitude === 'number' ? resolved.longitude : null,
      })
    } else {
      setLocationDetails({
        city: '',
        country: '',
        latitude: null,
        longitude: null,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!destination.trim()) {
      setErrorMsg('Destination is required.')
      return
    }
    if (!startDate) {
      setErrorMsg('Start date is required.')
      return
    }
    if (!endDate) {
      setErrorMsg('End date is required.')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('End date cannot be earlier than start date.')
      return
    }

    try {
      setLoading(true)

      let finalLocation = { ...locationDetails }
      if (destination.trim() && (finalLocation.latitude === null || !finalLocation.city)) {
        const resolved = await resolveDestination(destination.trim())
        if (resolved) {
          finalLocation = {
            city: resolved.city,
            country: resolved.country,
            latitude: resolved.latitude,
            longitude: resolved.longitude,
          }
        }
      }

      await onCreate({
        destination: destination.trim(),
        city: finalLocation.city || destination.trim(),
        country: finalLocation.country || '',
        latitude: finalLocation.latitude ?? null,
        longitude: finalLocation.longitude ?? null,
        startDate,
        endDate,
        description: description.trim(),
        coverColor,
        status: 'planning',
      })
      onClose()
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to create trip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 text-foreground overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Create New Trip</h2>
              <p className="text-xs text-muted-foreground">
                Set destination and travel dates to start planning
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Destination *
            </label>
            <DestinationSearchInput
              value={destination}
              onChange={handleDestinationChange}
              placeholder="Search destination (e.g. Kyoto, Japan or Paris, France)"
              autoFocus
              required
            />
            {locationDetails.latitude !== null && locationDetails.longitude !== null && (
              <div className="mt-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-semibold truncate">
                    {[locationDetails.city, locationDetails.country].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-card px-2 py-0.5 rounded-md border border-border">
                  <Compass className="w-3 h-3 text-primary" />
                  <span>{formatCoords(locationDetails.latitude, locationDetails.longitude)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                End Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Description / Notes (Optional)
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary, travel companions, budget goals..."
                rows={2}
                className="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Theme Accent
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCoverColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
                    coverColor === c.id
                      ? 'ring-2 ring-offset-2 ring-primary ring-offset-background scale-110'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating Trip...' : 'Create Trip'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

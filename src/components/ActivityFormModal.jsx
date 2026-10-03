import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, Tag, AlignLeft, CheckCircle2, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { id: 'sightseeing', label: 'Sightseeing & Culture' },
  { id: 'dining', label: 'Food & Dining' },
  { id: 'transport', label: 'Flight & Transit' },
  { id: 'lodging', label: 'Hotel & Stay' },
  { id: 'entertainment', label: 'Entertainment & Nightlife' },
  { id: 'relaxation', label: 'Relaxation & Wellness' },
  { id: 'other', label: 'Other Activity' },
]

export default function ActivityFormModal({ isOpen, onClose, onSave, tripId, activity = null, defaultDate = '' }) {
  const [title, setTitle] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('sightseeing')
  const [notes, setNotes] = useState('')
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (activity && activity.data) {
      setTitle(activity.data.title || '')
      setDateTime(activity.data.dateTime || '')
      setLocation(activity.data.location || '')
      setCategory(activity.data.category || 'sightseeing')
      setNotes(activity.data.notes || '')
      setCompleted(Boolean(activity.data.completed))
    } else {
      setTitle('')
      // Set default date if available, e.g. "YYYY-MM-DD" + "T10:00"
      if (defaultDate) {
        const datePart = defaultDate.includes('T') ? defaultDate.split('T')[0] : defaultDate
        const timePart = defaultDate.includes('T') ? defaultDate.split('T')[1].slice(0, 5) : '10:00'
        setDateTime(`${datePart}T${timePart || '10:00'}`)
      } else {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        const d = String(now.getDate()).padStart(2, '0')
        setDateTime(`${y}-${m}-${d}T10:00`)
      }
      setLocation('')
      setCategory('sightseeing')
      setNotes('')
      setCompleted(false)
    }
  }, [activity, defaultDate, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!title.trim()) {
      setErrorMsg('Activity name is required.')
      return
    }
    if (!dateTime) {
      setErrorMsg('Date and time is required.')
      return
    }

    try {
      setLoading(true)
      await onSave({
        tripId,
        title: title.trim(),
        dateTime,
        location: location.trim(),
        category,
        notes: notes.trim(),
        completed: completed ? 1 : 0,
      })
      onClose()
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to save activity.')
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
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {activity ? 'Edit Activity' : 'Add Timed Activity'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Schedule an event or milestone on your itinerary
            </p>
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
              Activity Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Visit Louvre Museum or Dinner at Le Petit"
              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Date & Time *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 1st Arrondissement, Paris or Flight UA 875"
                className="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Notes & Booking Details
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Confirmation #, reservation time, tips, packing list..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="completedCheck"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
            />
            <label htmlFor="completedCheck" className="text-xs text-foreground select-none cursor-pointer">
              Mark as completed
            </label>
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
              <span>{loading ? 'Saving...' : activity ? 'Update Activity' : 'Add Activity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

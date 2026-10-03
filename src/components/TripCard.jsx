import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, ArrowRight, MoreVertical, Edit2, Trash2, Compass } from 'lucide-react'
import { formatCoords } from './DestinationSearchInput'

const COLOR_MAP = {
  sky: 'from-sky-500/20 via-sky-500/5 to-transparent border-sky-500/30 text-sky-400',
  emerald: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-400',
  indigo: 'from-indigo-500/20 via-indigo-500/5 to-transparent border-indigo-500/30 text-indigo-400',
  amber: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/30 text-amber-400',
  rose: 'from-rose-500/20 via-rose-500/5 to-transparent border-rose-500/30 text-rose-400',
  purple: 'from-purple-500/20 via-purple-500/5 to-transparent border-purple-500/30 text-purple-400',
}

export default function TripCard({ trip, activityCount = 0, onEdit, onDelete }) {
  const data = trip.data || {}
  const {
    destination,
    city,
    country,
    latitude,
    longitude,
    startDate,
    endDate,
    description,
    coverColor = 'sky',
    status = 'planning',
  } = data

  const calculateDays = () => {
    if (!startDate || !endDate) return null
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays === 1 ? '1 day' : `${diffDays} days`
  }

  const duration = calculateDays()
  const colorStyle = COLOR_MAP[coverColor] || COLOR_MAP.sky

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
      {/* Top accent gradient */}
      <div
        className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${colorStyle} rounded-t-2xl opacity-40 pointer-events-none`}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-border bg-background/60 backdrop-blur-sm mb-2 text-foreground/80">
              <span className="capitalize">{status}</span>
              {duration && <span>• {duration}</span>}
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{destination}</span>
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(trip)}
              title="Edit Trip"
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(trip.recordId, destination)}
              title="Delete Trip"
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {startDate} {endDate && `— ${endDate}`}
          </span>
        </div>

        {typeof latitude === 'number' && typeof longitude === 'number' && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted/60 text-[11px] font-mono text-muted-foreground border border-border/40">
            <Compass className="w-3 h-3 text-primary shrink-0" />
            <span>{formatCoords(latitude, longitude)}</span>
            {country && <span>• {country}</span>}
          </div>
        )}

        {description ? (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground/60 italic">No notes added.</p>
        )}
      </div>

      <div className="relative mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{activityCount}</span>{' '}
          {activityCount === 1 ? 'activity' : 'activities'} planned
        </div>

        <Link
          to={`/trips/${trip.recordId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 group-hover:translate-x-0.5 transition-all"
        >
          <span>Open Itinerary</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

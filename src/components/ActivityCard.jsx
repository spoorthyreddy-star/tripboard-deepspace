import React from 'react'
import {
  Clock,
  MapPin,
  Tag,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Utensils,
  Camera,
  Plane,
  Building,
  Sparkles,
  Coffee,
  Calendar,
} from 'lucide-react'

const CATEGORY_CONFIG = {
  sightseeing: {
    label: 'Sightseeing',
    icon: Camera,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  dining: {
    label: 'Dining',
    icon: Utensils,
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  transport: {
    label: 'Transport',
    icon: Plane,
    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  lodging: {
    label: 'Stay',
    icon: Building,
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  entertainment: {
    label: 'Entertainment',
    icon: Sparkles,
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  relaxation: {
    label: 'Relaxation',
    icon: Coffee,
    color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  },
  other: {
    label: 'Activity',
    icon: Tag,
    color: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  },
}

export default function ActivityCard({ activity, onToggleComplete, onEdit, onDelete }) {
  const data = activity.data || {}
  const { title, dateTime, location, category = 'sightseeing', notes, completed } = data

  const isCompleted = Boolean(completed)
  const catConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other
  const IconComponent = catConfig.icon

  // Format time (e.g. "10:30 AM")
  const formatTime = (isoString) => {
    if (!isoString) return ''
    try {
      if (isoString.includes('T')) {
        const timePart = isoString.split('T')[1].slice(0, 5)
        const [hStr, mStr] = timePart.split(':')
        const hours = parseInt(hStr, 10)
        const minutes = mStr || '00'
        if (!isNaN(hours)) {
          const ampm = hours >= 12 ? 'PM' : 'AM'
          const h12 = hours % 12 || 12
          return `${h12}:${minutes} ${ampm}`
        }
      }
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoString
    }
  }

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-2xl border p-4 transition-all duration-200 ${
        isCompleted
          ? 'bg-card/40 border-border/50 opacity-75'
          : 'bg-card border-border hover:border-primary/40 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Complete toggle checkbox */}
      <button
        type="button"
        onClick={() => onToggleComplete(activity.recordId, !isCompleted)}
        className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
        title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {dateTime && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Clock className="w-3 h-3" />
              <span>{formatTime(dateTime)}</span>
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${catConfig.color}`}
          >
            <IconComponent className="w-3 h-3" />
            <span>{catConfig.label}</span>
          </span>
        </div>

        <h4
          className={`text-base font-semibold text-foreground tracking-tight transition-all break-words ${
            isCompleted ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {title}
        </h4>

        {location && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {notes && (
          <p className="mt-2 text-xs text-muted-foreground/80 bg-background/50 p-2.5 rounded-xl border border-border/60 leading-relaxed whitespace-pre-wrap break-words">
            {notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onEdit(activity)}
          title="Edit Activity"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(activity.recordId, title)}
          title="Delete Activity"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

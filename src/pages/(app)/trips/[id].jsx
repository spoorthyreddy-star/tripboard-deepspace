import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  useQuery,
  useMutations,
} from 'deepspace'
import { useTabAwarePresence } from '../../../hooks/useTabAwarePresence'
import { useToast } from '@/components/ui'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Search,
  Filter,
  Edit3,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Compass,
} from 'lucide-react'
import ActivityCard from '../../../components/ActivityCard'
import ActivityFormModal from '../../../components/ActivityFormModal'
import EditTripModal from '../../../components/EditTripModal'
import RealtimeIndicator from '../../../components/RealtimeIndicator'
import DestinationWeather from '../../../components/DestinationWeather'
import AiItineraryModal from '../../../components/AiItineraryModal'
import { formatCoords } from '../../../components/DestinationSearchInput'

const COLOR_MAP = {
  sky: 'from-sky-500/20 via-sky-500/5 to-transparent border-sky-500/30 text-sky-400',
  emerald: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-400',
  indigo: 'from-indigo-500/20 via-indigo-500/5 to-transparent border-indigo-500/30 text-indigo-400',
  amber: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/30 text-amber-400',
  rose: 'from-rose-500/20 via-rose-500/5 to-transparent border-rose-500/30 text-rose-400',
  purple: 'from-purple-500/20 via-purple-500/5 to-transparent border-purple-500/30 text-purple-400',
}

export default function TripItineraryPage() {
  const { id } = useParams()
  const { success, error, warning } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDay, setSelectedDay] = useState('all')
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [formDefaultDate, setFormDefaultDate] = useState('')
  const [isEditTripOpen, setIsEditTripOpen] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Real-time tab-aware presence room for this trip
  useTabAwarePresence(id)

  // Subscriptions to trips and activities
  const { records: trips, status: tripsStatus } = useQuery('trips')
  const { records: activities, status: activitiesStatus } = useQuery('activities', {
    where: { tripId: id },
    orderBy: 'dateTime',
    orderDir: 'asc',
  })

  // Mutations
  const { put: putTrip } = useMutations('trips')
  const {
    create: createActivity,
    put: putActivity,
    remove: removeActivity,
  } = useMutations('activities')

  // Find the trip
  const trip = useMemo(() => {
    return trips?.find((t) => t.recordId === id)
  }, [trips, id])

  // Filter activities for this trip
  const tripActivities = useMemo(() => {
    if (!activities) return []
    return activities.filter((a) => a.data?.tripId === id)
  }, [activities, id])

  // Compute days list from trip startDate to endDate
  const tripDays = useMemo(() => {
    if (!trip?.data?.startDate || !trip?.data?.endDate) return []
    const startStr = trip.data.startDate.split('T')[0]
    const endStr = trip.data.endDate.split('T')[0]
    const startParts = startStr.split('-').map(Number)
    const endParts = endStr.split('-').map(Number)
    if (startParts.length !== 3 || endParts.length !== 3 || startParts.some(isNaN) || endParts.some(isNaN)) return []

    const start = new Date(startParts[0], startParts[1] - 1, startParts[2])
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2])

    const days = []
    let current = new Date(start)
    let dayIndex = 1

    // Bound loop to max 60 days to prevent infinite loops
    while (current <= end && dayIndex <= 60) {
      const y = current.getFullYear()
      const m = String(current.getMonth() + 1).padStart(2, '0')
      const d = String(current.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`

      const label = current.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      days.push({ index: dayIndex, dateStr, label })
      current.setDate(current.getDate() + 1)
      dayIndex++
    }
    return days
  }, [trip?.data?.startDate, trip?.data?.endDate])

  // Get currently selected day object
  const selectedDayInfo = useMemo(() => {
    if (selectedDay === 'all') return null
    return tripDays.find((d) => d.dateStr === selectedDay) || null
  }, [selectedDay, tripDays])

  // Filter activities by day, category, and search query
  const filteredActivities = useMemo(() => {
    return tripActivities.filter((act) => {
      const data = act.data || {}

      // Filter by day
      if (selectedDay !== 'all') {
        const actDate = data.dateTime ? data.dateTime.split('T')[0] : ''
        if (actDate !== selectedDay) return false
      }

      // Filter by category
      if (selectedCategory !== 'all') {
        if (data.category !== selectedCategory) return false
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const title = (data.title || '').toLowerCase()
        const loc = (data.location || '').toLowerCase()
        const notes = (data.notes || '').toLowerCase()
        if (!title.includes(q) && !loc.includes(q) && !notes.includes(q)) {
          return false
        }
      }

      return true
    })
  }, [tripActivities, selectedDay, selectedCategory, searchQuery])

  // Group activities chronologically by date
  const groupedActivities = useMemo(() => {
    const groups = {}
    filteredActivities.forEach((act) => {
      const dt = act.data?.dateTime || ''
      const dateKey = dt.split('T')[0] || 'Unscheduled'
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(act)
    })

    // Sort each group's activities chronologically
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const timeA = a.data?.dateTime || ''
        const timeB = b.data?.dateTime || ''
        return timeA.localeCompare(timeB)
      })
    })

    // Sort group date keys
    const sortedKeys = Object.keys(groups).sort()
    return sortedKeys.map((dateKey) => ({
      dateKey,
      items: groups[dateKey],
    }))
  }, [filteredActivities])

  // Handlers
  const handleSaveActivity = async (activityData) => {
    try {
      if (editingActivity) {
        await putActivity(editingActivity.recordId, activityData)
        success('Activity updated', `"${activityData.title}" updated and synced.`)
      } else {
        await createActivity(activityData)
        success('Activity added', `"${activityData.title}" scheduled and synced.`)
      }
      setEditingActivity(null)
      if (activityData.dateTime) {
        const targetDate = activityData.dateTime.split('T')[0]
        if (selectedDay !== 'all' && selectedDay !== targetDate) {
          setSelectedDay(targetDate)
        }
      }
    } catch (err) {
      error('Failed to save activity', err?.message || String(err))
      throw err
    }
  }

  const handleToggleComplete = async (recordId, completed) => {
    try {
      await putActivity(recordId, { completed: completed ? 1 : 0 })
    } catch (err) {
      error('Could not update status', err?.message || String(err))
    }
  }

  const handleDeleteActivity = async (recordId, title) => {
    const confirmDelete = window.confirm(`Delete activity "${title}"?`)
    if (!confirmDelete) return

    try {
      await removeActivity(recordId)
      success('Activity deleted', `"${title}" has been removed.`)
    } catch (err) {
      error('Could not delete activity', err?.message || String(err))
    }
  }

  const handleSaveTrip = async (recordId, patch) => {
    try {
      await putTrip(recordId, patch)
      success('Trip updated', 'Trip parameters saved.')
    } catch (err) {
      error('Could not update trip', err?.message || String(err))
      throw err
    }
  }

  const handleOpenAiModal = () => {
    if (selectedDay === 'all') {
      if (warning) {
        warning(
          'Select a day first',
          'Please select a specific day tab (e.g. Day 4: Fri, Oct 23) to generate an AI itinerary for that day.'
        )
      }
      return
    }
    setIsAiModalOpen(true)
  }

  const handleSaveAiActivities = async (newActivities) => {
    try {
      for (const act of newActivities) {
        await createActivity({
          tripId: id,
          title: act.title,
          dateTime: act.dateTime,
          category: act.category,
          location: act.location,
          notes: act.notes,
          completed: 0,
        })
      }
      success(
        'Activities Added!',
        `Successfully saved ${newActivities.length} AI-generated ${
          newActivities.length === 1 ? 'activity' : 'activities'
        } to your itinerary.`
      )
      if (newActivities[0]?.dateTime) {
        const actDate = newActivities[0].dateTime.split('T')[0]
        if (selectedDay !== actDate) {
          setSelectedDay(actDate)
        }
      }
    } catch (err) {
      error('Failed to save activities', err?.message || String(err))
      throw err
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    success('Link copied!', 'Paste in a new tab or window to test live sync.')
  }

  // Format date header
  const formatDateHeader = (dateStr) => {
    if (!dateStr || dateStr === 'Unscheduled') return 'Unscheduled Activities'
    try {
      const parts = dateStr.split('T')[0].split('-').map(Number)
      if (parts.length === 3 && !parts.some(isNaN)) {
        const [year, month, day] = parts
        const d = new Date(year, month - 1, day)
        return d.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      }
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Loading state
  if (tripsStatus === 'loading' && !trip) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-muted-foreground animate-pulse">
        <p>Loading trip itinerary from DeepSpace...</p>
      </div>
    )
  }

  // Not found
  if (tripsStatus === 'ready' && !trip) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-xl font-bold text-foreground">Trip Not Found</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          This trip may have been removed or you do not have permission to view it.
        </p>
        <Link
          to="/home"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Trips</span>
        </Link>
      </div>
    )
  }

  const { destination, city, country, latitude, longitude, startDate, endDate, description, coverColor } = trip.data || {}
  const colorStyle = COLOR_MAP[coverColor] || COLOR_MAP.sky
  const completedCount = tripActivities.filter((a) => a.data?.completed).length
  const progressPercent =
    tripActivities.length > 0 ? Math.round((completedCount / tripActivities.length) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          to="/home"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Trips</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <RealtimeIndicator status={activitiesStatus} />
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy URL to test in another tab"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/60 hover:bg-muted text-xs font-medium text-foreground transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied URL!' : 'Share / Multi-Tab Test'}</span>
          </button>
        </div>
      </div>

      {/* Trip Header Banner */}
      <div className="relative rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl overflow-hidden mb-8">
        {/* Accent top ambient glow matching trip cover color */}
        <div
          className={`absolute inset-x-0 top-0 h-36 bg-gradient-to-b ${colorStyle} opacity-30 pointer-events-none`}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>Itinerary Planner</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {destination}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                <span>
                  {startDate} {endDate && `— ${endDate}`}
                </span>
              </span>
              {country && (
                <>
                  <span>•</span>
                  <span>{country}</span>
                </>
              )}
              {typeof latitude === 'number' && typeof longitude === 'number' && (
                <>
                  <span>•</span>
                  <span className="font-mono text-xs inline-flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    {formatCoords(latitude, longitude)}
                  </span>
                </>
              )}
              <span>•</span>
              <span>{tripActivities.length} activities scheduled</span>
            </div>

            {description && (
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground/90 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditTripOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background/50 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Trip</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingActivity(null)
                setFormDefaultDate(selectedDay !== 'all' ? selectedDay : (trip?.data?.startDate ? trip.data.startDate.split('T')[0] : ''))
                setIsActivityModalOpen(true)
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Activity</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {tripActivities.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Itinerary Progress</span>
              <span>
                {completedCount} of {tripActivities.length} completed ({progressPercent}%)
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Real Destination Weather (DeepSpace OpenWeatherMap Integration) */}
      {destination && (
        <DestinationWeather destination={destination} />
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4 mb-6">
        {/* Day selection tabs */}
        {tripDays.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedDay('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedDay === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card/60 border border-border/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              All Days ({tripActivities.length})
            </button>
            {tripDays.map((day) => {
              const count = tripActivities.filter(
                (a) => a.data?.dateTime && a.data.dateTime.split('T')[0] === day.dateStr
              ).length
              return (
                <button
                  type="button"
                  key={day.dateStr}
                  onClick={() => setSelectedDay(day.dateStr)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedDay === day.dateStr
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card/60 border border-border/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Day {day.index}: {day.label} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>
        )}

        {/* Search and category pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities or locations..."
              className="w-full rounded-xl border border-border bg-card/60 pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'sightseeing', label: 'Sightseeing' },
              { id: 'dining', label: 'Dining' },
              { id: 'transport', label: 'Transport' },
              { id: 'lodging', label: 'Stay' },
              { id: 'entertainment', label: 'Entertainment' },
            ].map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-muted text-foreground ring-1 ring-border font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="space-y-8">
        {activitiesStatus === 'loading' && (!activities || activities.length === 0) ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl border border-border/60 bg-card/40 p-4" />
            ))}
          </div>
        ) : groupedActivities.length > 0 ? (
          groupedActivities.map(({ dateKey, items }) => (
            <div key={dateKey} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <h3 className="text-sm font-bold tracking-tight text-foreground">
                    {formatDateHeader(dateKey)}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    ({items.length} {items.length === 1 ? 'event' : 'events'})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingActivity(null)
                    setFormDefaultDate(dateKey !== 'Unscheduled' ? dateKey : '')
                    setIsActivityModalOpen(true)
                  }}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to day</span>
                </button>
              </div>

              <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-border/40 ml-1">
                {items.map((activity) => (
                  <ActivityCard
                    key={activity.recordId}
                    activity={activity}
                    onToggleComplete={handleToggleComplete}
                    onEdit={(act) => {
                      setEditingActivity(act)
                      setIsActivityModalOpen(true)
                    }}
                    onDelete={handleDeleteActivity}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border/80 bg-card/30 p-12 text-center max-w-md mx-auto my-8">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No activities found</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {searchQuery || selectedCategory !== 'all' || selectedDay !== 'all'
                ? 'Try adjusting your filters or search keywords.'
                : 'Your itinerary is currently empty. Add your first planned activity!'}
            </p>
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenAiModal}
                disabled={selectedDay === 'all'}
                title={
                  selectedDay === 'all'
                    ? 'Please select a specific day tab (e.g. Day 4: Fri, Oct 23) first to generate with AI'
                    : `Generate activities for Day ${selectedDayInfo?.index}: ${selectedDayInfo?.label}`
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span>
                  {selectedDayInfo ? `Generate Day ${selectedDayInfo.index} with AI` : 'Generate with AI'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingActivity(null)
                  setFormDefaultDate(selectedDay !== 'all' ? selectedDay : (trip?.data?.startDate ? trip.data.startDate.split('T')[0] : ''))
                  setIsActivityModalOpen(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Activity</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ActivityFormModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false)
          setEditingActivity(null)
          setFormDefaultDate('')
        }}
        onSave={handleSaveActivity}
        tripId={id}
        activity={editingActivity}
        defaultDate={formDefaultDate || (selectedDay !== 'all' ? selectedDay : (trip?.data?.startDate ? trip.data.startDate.split('T')[0] : ''))}
      />

      <EditTripModal
        trip={trip}
        isOpen={isEditTripOpen}
        onClose={() => setIsEditTripOpen(false)}
        onSave={handleSaveTrip}
      />

      <AiItineraryModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        trip={trip}
        targetDate={selectedDay !== 'all' ? selectedDay : null}
        targetDayInfo={selectedDayInfo}
        onSaveActivities={handleSaveAiActivities}
      />
    </div>
  )
}

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useAuthProfileReady,
  useQuery,
  useMutations,
  AuthOverlay,
} from 'deepspace'
import { useToast } from '@/components/ui'
import {
  Compass,
  Plus,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  Plane,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import TripCard from '../../components/TripCard'
import CreateTripModal from '../../components/CreateTripModal'
import EditTripModal from '../../components/EditTripModal'
import RealtimeIndicator from '../../components/RealtimeIndicator'

export default function HomePage() {
  const { isLoaded, isSignedIn, user, userLoading } = useAuthProfileReady({ requireUser: false })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { success, error, warning } = useToast()

  // Subscribe to trips and activities with real-time DO sync
  const { records: trips, status: tripsStatus } = useQuery('trips', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })

  const { records: activities } = useQuery('activities')
  const { create: createTrip, put: putTrip, remove: removeTrip } = useMutations('trips')

  // Calculate activity counts per trip
  const activityCountByTrip = React.useMemo(() => {
    const map = {}
    if (activities) {
      activities.forEach((act) => {
        const tId = act.data?.tripId
        if (tId) {
          map[tId] = (map[tId] || 0) + 1
        }
      })
    }
    return map
  }, [activities])

  // Filter trips by search query
  const filteredTrips = React.useMemo(() => {
    if (!trips) return []
    if (!searchQuery.trim()) return trips
    const q = searchQuery.toLowerCase()
    return trips.filter((t) => {
      const dest = t.data?.destination?.toLowerCase() || ''
      const desc = t.data?.description?.toLowerCase() || ''
      return dest.includes(q) || desc.includes(q)
    })
  }, [trips, searchQuery])

  // Handle trip creation
  const handleCreateTrip = async (tripData) => {
    try {
      await createTrip(tripData)
      success('Trip created successfully', `Your trip to ${tripData.destination} is ready to plan!`)
    } catch (err) {
      error('Could not create trip', err?.message || String(err))
      throw err
    }
  }

  // Handle trip update
  const handleSaveTrip = async (recordId, patch) => {
    try {
      await putTrip(recordId, patch)
      success('Trip updated', 'Changes have synced across all sessions.')
    } catch (err) {
      error('Could not update trip', err?.message || String(err))
      throw err
    }
  }

  // Handle trip deletion
  const handleDeleteTrip = async (recordId, destination) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the trip to "${destination}"? This will remove all planned activities for this trip.`
    )
    if (!confirmDelete) return

    try {
      await removeTrip(recordId)
      success('Trip deleted', `"${destination}" has been removed.`)
    } catch (err) {
      error('Could not delete trip', err?.message || String(err))
    }
  }

  // Signed out presentation
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl text-center">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-6 shadow-inner ring-1 ring-primary/20">
            <Compass className="w-10 h-10 animate-spin-slow" />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Plan Trips Together in <span className="text-primary">Real Time</span>
          </h1>

          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            TripBoard uses DeepSpace primitives and Durable Objects to synchronize your travel
            itineraries live across multiple tabs and devices.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Sign In to Open TripBoard</span>
            </button>
            <Link
              to="/"
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-border bg-card/60 text-foreground font-medium hover:bg-muted transition-colors text-center"
            >
              Explore Features
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
                <Zap className="w-4 h-4" />
                <span>Instant Sync</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Durable Object WebSockets broadcast itinerary changes instantly to every active tab.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Account Isolation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Row-level permissions guarantee users have their own private, authenticated workspace.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>Timed Itineraries</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Organize activities, dining, transport, and notes chronologically by day.
              </p>
            </div>
          </div>
        </div>

        {showAuthModal && <AuthOverlay onClose={() => setShowAuthModal(false)} />}
      </div>
    )
  }

  const upcomingCount = (trips || []).filter((t) => t.data?.status !== 'completed').length
  const totalActivitiesCount = activities?.length || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header & Real-time status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              My Trips
            </h1>
            <RealtimeIndicator status={tripsStatus} />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {user ? `Signed in as ${user.name || user.email}` : 'Signed in'} • Changes sync
            automatically across all open tabs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Trip</span>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground">Total Trips</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {trips ? trips.length : '...'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground">Upcoming & Active</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-primary">
            {trips ? upcomingCount : '...'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground">Total Activities</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-400">
            {activities ? totalActivitiesCount : '...'}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm">
          <div className="text-xs font-medium text-muted-foreground">Sync Engine</div>
          <div className="mt-1 text-sm font-semibold text-foreground flex items-center gap-1.5 pt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>DeepSpace DO</span>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips by destination..."
            className="w-full rounded-xl border border-border bg-card/60 pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Trips Grid */}
      <div className="mt-6">
        {tripsStatus === 'loading' && (!trips || trips.length === 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl border border-border/60 bg-card/40 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-6 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
                <div className="h-8 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.recordId}
                trip={trip}
                activityCount={activityCountByTrip[trip.recordId] || 0}
                onEdit={(t) => setEditingTrip(t)}
                onDelete={handleDeleteTrip}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/80 bg-card/30 p-12 text-center max-w-md mx-auto my-8">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {searchQuery ? 'No matching trips found' : 'No trips planned yet'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {searchQuery
                ? 'Try a different search keyword.'
                : 'Create your first trip destination to start adding timed itinerary activities!'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Trip</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTripModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateTrip}
      />

      <EditTripModal
        trip={editingTrip}
        isOpen={Boolean(editingTrip)}
        onClose={() => setEditingTrip(null)}
        onSave={handleSaveTrip}
      />
    </div>
  )
}

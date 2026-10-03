import React from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { APP_NAME } from '../constants'
import { seo } from '../seo'
import { Compass, Zap, Users, Calendar, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />
      <div
        data-testid="static-landing"
        className="min-h-screen bg-background text-foreground flex flex-col justify-between"
      >
        {/* Top bar */}
        <header className="border-b border-border/60 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <Compass className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
            </div>
            <Link
              to="/home"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:opacity-90 transition-opacity"
            >
              <span>Enter the app</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6 animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            <span>Built on DeepSpace Primitives & Cloudflare Durable Objects</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Collaborative Trip Itineraries with <span className="text-primary">Instant Real-Time Sync</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            TripBoard empowers travelers and teams to plan trips, organize timed daily activities, and
            collaborate across tabs and windows with zero-latency synchronization.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              to="/home"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:opacity-90 transition-all hover:scale-105"
            >
              <span>Launch TripBoard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full">
            <div className="p-6 rounded-2xl border border-border/80 bg-card/50 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Real-Time Sync</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Changes made in one tab or browser window broadcast instantly to all connected users
                without manual refreshes.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/80 bg-card/50 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Day-by-Day Timeline</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Add, edit, reschedule, and complete timed activities with category tags and location
                pins.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border/80 bg-card/50 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">User-Isolated Storage</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                DeepSpace row-level security isolates each user's trips and itineraries to their
                authenticated session.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_NAME}. Powered by DeepSpace SDK on Cloudflare Workers.</p>
        </footer>
      </div>
    </>
  )
}

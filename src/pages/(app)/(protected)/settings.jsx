import React from 'react'
import { signOut, useUser } from 'deepspace'
import { Button } from '@/components/ui'

export default function SettingsPage() {
  const { user } = useUser()

  return (
    <div className="min-h-full text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Settings</h1>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Your Account</h2>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Name</dt>
              <dd className="text-foreground font-medium">{user?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="text-foreground font-medium">{user?.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Account Role</dt>
              <dd className="text-foreground font-medium capitalize">{user?.role || 'member'}</dd>
            </div>
          </dl>

          <Button variant="secondary" className="mt-6 rounded-xl" onClick={() => signOut()}>
            Sign out
          </Button>
        </section>
      </div>
    </div>
  )
}

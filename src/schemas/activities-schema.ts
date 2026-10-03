import type { CollectionSchema } from 'deepspace/schema'

export const activitiesSchema: CollectionSchema = {
  name: 'activities',
  columns: [
    { name: 'tripId', storage: 'text', interpretation: 'plain', required: true },
    { name: 'title', storage: 'text', interpretation: 'plain', required: true },
    { name: 'dateTime', storage: 'text', interpretation: { kind: 'datetime' }, required: true },
    { name: 'location', storage: 'text', interpretation: 'plain' },
    { name: 'category', storage: 'text', interpretation: 'plain' },
    { name: 'notes', storage: 'text', interpretation: 'plain' },
    { name: 'completed', storage: 'number', interpretation: { kind: 'boolean' } },
  ],
  permissions: {
    viewer: { read: 'own', create: false, update: 'own', delete: false },
    member: { read: 'own', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

import type { CollectionSchema } from 'deepspace/schema'

export const tripsSchema: CollectionSchema = {
  name: 'trips',
  columns: [
    { name: 'destination', storage: 'text', interpretation: 'plain', required: true },
    { name: 'city', storage: 'text', interpretation: 'plain' },
    { name: 'country', storage: 'text', interpretation: 'plain' },
    { name: 'latitude', storage: 'number', interpretation: 'plain' },
    { name: 'longitude', storage: 'number', interpretation: 'plain' },
    { name: 'startDate', storage: 'text', interpretation: { kind: 'date' }, required: true },
    { name: 'endDate', storage: 'text', interpretation: { kind: 'date' }, required: true },
    { name: 'description', storage: 'text', interpretation: 'plain' },
    { name: 'coverColor', storage: 'text', interpretation: 'plain' },
    { name: 'status', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    viewer: { read: 'own', create: false, update: 'own', delete: false },
    member: { read: 'own', create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

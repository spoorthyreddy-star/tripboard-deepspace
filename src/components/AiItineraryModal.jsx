import React, { useState, useEffect, useMemo } from 'react'
import { integration } from 'deepspace'
import {
  Sparkles,
  X,
  Calendar,
  MapPin,
  Clock,
  Compass,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Utensils,
  Landmark,
  Trees,
  Gem,
  Music,
  ShoppingBag,
  HeartHandshake,
  Palette,
} from 'lucide-react'

const INTEREST_OPTIONS = [
  { id: 'culture', label: 'Culture & History', icon: Landmark },
  { id: 'food', label: 'Food & Culinary', icon: Utensils },
  { id: 'nature', label: 'Nature & Parks', icon: Trees },
  { id: 'gems', label: 'Hidden Gems', icon: Gem },
  { id: 'art', label: 'Art & Architecture', icon: Palette },
  { id: 'shopping', label: 'Local Markets & Shopping', icon: ShoppingBag },
  { id: 'nightlife', label: 'Nightlife & Drinks', icon: Music },
  { id: 'relaxation', label: 'Relaxation & Wellness', icon: HeartHandshake },
]

const CATEGORY_COLORS = {
  sightseeing: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  dining: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  transport: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  lodging: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  entertainment: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  relaxation: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  other: 'bg-muted text-muted-foreground border-border',
}

const VALID_CATEGORIES = [
  'sightseeing',
  'dining',
  'transport',
  'lodging',
  'entertainment',
  'relaxation',
  'other',
]

export default function AiItineraryModal({
  isOpen,
  onClose,
  trip,
  targetDate,
  targetDayInfo,
  onSaveActivities,
}) {
  const [selectedInterests, setSelectedInterests] = useState(['culture', 'food'])
  const [customPreferences, setCustomPreferences] = useState('')
  const [pace, setPace] = useState('balanced') // 'relaxed' | 'balanced' | 'packed'
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [generatedActivities, setGeneratedActivities] = useState([])
  const [selectedIndices, setSelectedIndices] = useState(new Set())

  const destination = trip?.data?.destination || ''
  const targetDayLabel = targetDayInfo
    ? `Day ${targetDayInfo.index}: ${targetDayInfo.label}`
    : targetDate || 'Selected Day'

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('')
      setGeneratedActivities([])
      setSelectedIndices(new Set())
    }
  }, [isOpen])

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Robust parser with markdown fence stripping, JSON cleaning, and truncated partial-recovery
  const extractAndParseItinerary = (rawContent) => {
    if (!rawContent || typeof rawContent !== 'string') {
      throw new Error('AI service returned an empty response. Please try regenerating.')
    }

    let text = rawContent.trim()

    // 1. Strip markdown code fences if present (```json ... ``` or ``` ...)
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i)
    if (fenceMatch && fenceMatch[1]) {
      text = fenceMatch[1].trim()
    }

    // 2. Locate the outer array bounds [ ... ]
    const firstBracket = text.indexOf('[')
    if (firstBracket === -1) {
      throw new Error('No structured itinerary JSON array found in AI response. Please try regenerating.')
    }

    const lastBracket = text.lastIndexOf(']')
    let candidate = ''

    if (lastBracket > firstBracket) {
      candidate = text.slice(firstBracket, lastBracket + 1)
    } else {
      // Stream was cut off before closing ']'
      candidate = text.slice(firstBracket)
    }

    // Helper to fix common LLM JSON syntax issues
    const cleanJson = (str) => {
      return str
        // Remove trailing commas before } or ]
        .replace(/,\s*([}\]])/g, '$1')
        // Normalize smart/typographical quotes
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        // Remove non-standard control characters (preserving newlines, tabs)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    }

    // 3. Try parsing candidate directly
    try {
      const parsed = JSON.parse(cleanJson(candidate))
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch (initialErr) {
      console.warn('Direct parse failed, attempting partial salvage for truncated JSON:', initialErr)
    }

    // 4. Salvage truncated JSON: find the last completed object closing brace '}' and close array
    const lastObjectEnd = candidate.lastIndexOf('}')
    if (lastObjectEnd > firstBracket) {
      const salvaged = cleanJson(candidate.slice(0, lastObjectEnd + 1)) + ']'
      try {
        const parsed = JSON.parse(salvaged)
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.info(`Salvaged ${parsed.length} completed activities from truncated AI stream.`)
          return parsed
        }
      } catch (salvageErr) {
        console.warn('Salvage parse failed:', salvageErr)
      }
    }

    throw new Error('Could not parse the AI itinerary. Please try regenerating.')
  }

  const handleGenerate = async () => {
    if (!destination) {
      setErrorMsg('Trip has no destination set.')
      return
    }
    if (!targetDate) {
      setErrorMsg('Please select a specific day tab (e.g. Day 4: Fri, Oct 23) first.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setGeneratedActivities([])
    setLoadingMessage(`Exploring activities for ${targetDayLabel} in ${destination}...`)

    const activeInterests = selectedInterests
      .map((id) => INTEREST_OPTIONS.find((opt) => opt.id === id)?.label)
      .filter(Boolean)
      .join(', ')

    const pacingInstruction =
      pace === 'relaxed'
        ? 'Generate a relaxed single-day plan with 2 well-spaced activities (e.g. morning and afternoon).'
        : pace === 'packed'
        ? 'Generate an active, packed single-day plan with 4-5 activities covering morning, lunch, afternoon, and evening.'
        : 'Generate a balanced single-day plan with 3-4 activities (morning, lunch, afternoon, evening).'

    const userPrompt = [
      `Destination: ${destination}`,
      `Target Date: ${targetDate} (${targetDayLabel})`,
      `Interests: ${activeInterests || 'General sightseeing, culture, food, and highlights'}`,
      customPreferences ? `Additional Preferences: ${customPreferences}` : null,
      pacingInstruction,
      `IMPORTANT INSTRUCTIONS:`,
      `- Generate activities ONLY for the single date: ${targetDate}.`,
      `- Every activity's "dateTime" MUST strictly start with "${targetDate}T" (e.g. "${targetDate}T09:30", "${targetDate}T13:00", "${targetDate}T16:30", "${targetDate}T19:30").`,
      `- Do NOT generate activities for any other date, day, or date range.`,
      `- Keep activities in chronological order across this single day.`,
      `- Categories MUST be one of: sightseeing, dining, transport, lodging, entertainment, relaxation, other.`,
      `- Keep notes concise (1-2 sentences).`,
      `Output format: Return ONLY a valid JSON array of objects without markdown preamble or explanation.`,
      `Each object schema:`,
      `{`,
      `  "title": "string (clear name of the spot or activity)",`,
      `  "dateTime": "${targetDate}THH:mm",`,
      `  "category": "sightseeing | dining | transport | lodging | entertainment | relaxation | other",`,
      `  "location": "string (neighborhood, address or landmark in ${destination})",`,
      `  "notes": "string (concise 1-2 sentence insider tip, recommendation or timing advice)"`,
      `}`,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      setLoadingMessage('Consulting DeepSpace AI...')

      const response = await integration.post('openai/chat-completion', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert travel concierge and itinerary architect. You generate practical, realistic travel activities for a single day of a trip. You output strictly a raw JSON array of activities with no markdown code fences, no backticks, and no introductory or explanatory text.',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 2500,
        temperature: 0.7,
      })

      if (!response.success) {
        throw new Error(response.error || 'AI generation failed. Please try again.')
      }

      setLoadingMessage('Formatting your itinerary...')

      const rawContent = response.data?.choices?.[0]?.message?.content || ''
      if (!rawContent) {
        throw new Error('AI returned an empty response. Please try again.')
      }

      const parsed = extractAndParseItinerary(rawContent)

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No activities were generated. Please try again.')
      }

      // Sanitize and validate activities strictly for targetDate
      const sanitized = parsed
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          let cat = typeof item.category === 'string' ? item.category.toLowerCase().trim() : 'sightseeing'
          if (!VALID_CATEGORIES.includes(cat)) {
            cat = 'sightseeing'
          }

          let dt = typeof item.dateTime === 'string' ? item.dateTime.trim() : ''
          // Enforce that dateTime strictly starts with targetDate
          if (dt.includes('T')) {
            const timePart = dt.split('T')[1].slice(0, 5)
            dt = `${targetDate}T${timePart}`
          } else if (dt.includes(':')) {
            dt = `${targetDate}T${dt.slice(0, 5)}`
          } else {
            const hour = String(9 + (index % 4) * 3).padStart(2, '0')
            dt = `${targetDate}T${hour}:00`
          }

          return {
            title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : `Activity ${index + 1}`,
            dateTime: dt,
            category: cat,
            location: typeof item.location === 'string' && item.location.trim() ? item.location.trim() : destination,
            notes: typeof item.notes === 'string' ? item.notes.trim() : '',
          }
        })

      if (sanitized.length === 0) {
        throw new Error('No valid activities could be generated. Please try regenerating.')
      }

      setGeneratedActivities(sanitized)
      // Check all activities by default
      setSelectedIndices(new Set(sanitized.map((_, i) => i)))
    } catch (err) {
      console.error('AI generation error:', err)
      setErrorMsg(err?.message || 'Failed to generate itinerary. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  const toggleSelectActivity = (index) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIndices.size === generatedActivities.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(generatedActivities.map((_, i) => i)))
    }
  }

  const handleSaveSelected = async () => {
    const toSave = generatedActivities.filter((_, i) => selectedIndices.has(i))
    if (toSave.length === 0) return

    setSaving(true)
    setErrorMsg('')

    try {
      await onSaveActivities(toSave)
      onClose()
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to save generated activities.')
    } finally {
      setSaving(false)
    }
  }

  // Group generated activities by date for cleaner display
  const groupedGenerated = useMemo(() => {
    const groups = {}
    generatedActivities.forEach((act, idx) => {
      const dateKey = act.dateTime ? act.dateTime.split('T')[0] : 'Scheduled'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push({ ...act, originalIndex: idx })
    })

    return Object.keys(groups)
      .sort()
      .map((dateKey) => ({
        dateKey,
        items: groups[dateKey],
      }))
  }, [generatedActivities])

  const formatDateHeader = (dateStr) => {
    try {
      const parts = dateStr.split('-').map(Number)
      if (parts.length === 3 && !parts.some(isNaN)) {
        const [y, m, d] = parts
        const date = new Date(y, m - 1, d)
        return date.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateTimeStr) => {
    try {
      if (!dateTimeStr || !dateTimeStr.includes('T')) return ''
      const timePart = dateTimeStr.split('T')[1].slice(0, 5)
      const [h, m] = timePart.split(':').map(Number)
      const period = h >= 12 ? 'PM' : 'AM'
      const displayH = h % 12 === 0 ? 12 : h % 12
      return `${displayH}:${String(m).padStart(2, '0')} ${period}`
    } catch {
      return ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl p-5 sm:p-7 text-foreground overflow-y-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-primary/20 via-sky-500/20 to-purple-500/20 border border-primary/30 text-primary">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Generate Day Itinerary</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                  DeepSpace AI
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {targetDayLabel} • {destination || 'your destination'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification with 1-click retry */}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-foreground text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Itinerary Generation Issue</p>
                <p className="text-muted-foreground mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Retry Generation</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="mt-5 space-y-6 flex-1">
          {/* Trip Summary Pills */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-border/60 bg-muted/30 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{destination || 'Destination not set'}</span>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{targetDayLabel}</span>
            </span>
          </div>

          {/* Configuration Form (shown when no activities generated yet or user wants to reconfigure) */}
          {generatedActivities.length === 0 && (
            <div className="space-y-4">
              {/* Interest Tags */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Select Interests & Travel Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {INTEREST_OPTIONS.map((item) => {
                    const isSelected = selectedInterests.includes(item.id)
                    const Icon = item.icon
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => toggleInterest(item.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary/50 bg-primary/10 text-primary shadow-xs'
                            : 'border-border/80 bg-background/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pacing */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Trip Pacing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'relaxed', label: 'Relaxed', desc: '~2 events/day' },
                    { id: 'balanced', label: 'Balanced', desc: '~3-4 events/day' },
                    { id: 'packed', label: 'Packed', desc: '~5 events/day' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPace(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        pace === p.id
                          ? 'border-primary/50 bg-primary/10 text-foreground ring-1 ring-primary/30'
                          : 'border-border/80 bg-background/50 text-muted-foreground hover:bg-muted/60'
                      }`}
                    >
                      <div className="text-xs font-semibold text-foreground">{p.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Notes */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Specific Requests or Tips (Optional)
                </label>
                <input
                  type="text"
                  value={customPreferences}
                  onChange={(e) => setCustomPreferences(e.target.value)}
                  placeholder="e.g. Vegetarian food spots, kid-friendly museums, walkability"
                  className="w-full rounded-xl border border-border bg-background/50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !destination}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shadow-md shadow-primary/20 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{loadingMessage || 'Generating Itinerary with DeepSpace AI...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        Generate {targetDayInfo ? `Day ${targetDayInfo.index}` : targetDate || 'Day'} Itinerary
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Generated Activities Preview */}
          {generatedActivities.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground font-semibold">{selectedIndices.size}</strong> of{' '}
                  <strong className="text-foreground font-semibold">{generatedActivities.length}</strong>{' '}
                  activities selected to save
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer inline-flex items-center gap-1"
                  >
                    {selectedIndices.size === generatedActivities.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
                {groupedGenerated.map(({ dateKey, items }) => (
                  <div key={dateKey} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>{formatDateHeader(dateKey)}</span>
                    </div>

                    <div className="space-y-2 pl-3 border-l-2 border-border/50 ml-1">
                      {items.map((act) => {
                        const isChecked = selectedIndices.has(act.originalIndex)
                        const catStyle = CATEGORY_COLORS[act.category] || CATEGORY_COLORS.other

                        return (
                          <div
                            key={act.originalIndex}
                            onClick={() => toggleSelectActivity(act.originalIndex)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'border-primary/40 bg-card hover:bg-card/90 shadow-xs'
                                : 'border-border/60 bg-muted/20 opacity-60 hover:opacity-80'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                className="mt-0.5 text-primary shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleSelectActivity(act.originalIndex)
                                }}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-primary" />
                                ) : (
                                  <Square className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-foreground">
                                    {act.title}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${catStyle}`}
                                  >
                                    {act.category}
                                  </span>
                                  {act.dateTime && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatTime(act.dateTime)}</span>
                                    </span>
                                  )}
                                </div>

                                {act.location && (
                                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                                    <span className="truncate">{act.location}</span>
                                  </div>
                                )}

                                {act.notes && (
                                  <p className="text-[11px] text-muted-foreground/90 leading-relaxed italic">
                                    "{act.notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-border/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {generatedActivities.length > 0 && (
            <button
              type="button"
              onClick={handleSaveSelected}
              disabled={saving || selectedIndices.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shadow-md shadow-primary/20 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding to Itinerary...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>
                    Add {selectedIndices.size} {selectedIndices.size === 1 ? 'Activity' : 'Activities'} to {targetDayInfo ? `Day ${targetDayInfo.index}` : 'Itinerary'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

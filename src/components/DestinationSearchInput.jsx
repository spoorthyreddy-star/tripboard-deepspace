import React, { useState, useEffect, useRef, useCallback } from 'react'
import { integration } from 'deepspace'
import { MapPin, Search, Loader2, X, Globe2, Compass } from 'lucide-react'

// Helper to convert country code (e.g. "US", "FR", "JP") to readable country name
export function getCountryName(countryCode) {
  if (!countryCode) return ''
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
    return regionNames.of(countryCode) || countryCode
  } catch {
    return countryCode
  }
}

// Format coordinates into human-readable representation
export function formatCoords(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return ''
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`
  const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`
  return `${latStr}, ${lonStr}`
}

// Automatically resolve destination location details via DeepSpace OpenWeatherMap integration
export async function resolveDestination(query) {
  if (!query || !query.trim()) return null
  try {
    const result = await integration.post('openweathermap/geocoding', {
      q: query.trim(),
      limit: 1,
    })

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      const item = result.data[0]
      const countryFull = getCountryName(item.country)
      return {
        city: item.name || '',
        state: item.state || '',
        countryCode: item.country || '',
        country: countryFull || item.country || '',
        latitude: typeof item.lat === 'number' ? item.lat : null,
        longitude: typeof item.lon === 'number' ? item.lon : null,
      }
    }
  } catch (err) {
    console.error('Destination geocoding resolution failed:', err)
  }
  return null
}

export default function DestinationSearchInput({
  value = '',
  onChange,
  placeholder = 'e.g. Kyoto, Japan or Paris, France',
  required = false,
  autoFocus = false,
  className = '',
}) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Keep internal input in sync if parent value changes externally
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Geocoding lookup via DeepSpace OpenWeatherMap integration
  const searchLocations = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const result = await integration.post('openweathermap/geocoding', {
        q: query.trim(),
        limit: 5,
      })

      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        // Deduplicate suggestions by name, state, country
        const seen = new Set()
        const unique = []

        for (const item of result.data) {
          const countryFull = getCountryName(item.country)
          const key = `${item.name}-${item.state || ''}-${item.country || ''}`
          if (!seen.has(key)) {
            seen.add(key)
            unique.push({
              name: item.name,
              state: item.state || '',
              countryCode: item.country || '',
              countryName: countryFull,
              lat: item.lat,
              lon: item.lon,
            })
          }
        }

        setSuggestions(unique)
        setIsOpen(unique.length > 0)
        setSelectedIndex(-1)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    } catch (err) {
      console.error('Destination geocoding lookup failed:', err)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e) => {
    const text = e.target.value
    setInputValue(text)
    onChange(text, null)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (text.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        searchLocations(text)
      }, 280)
    } else {
      setSuggestions([])
      setIsOpen(false)
      setLoading(false)
    }
  }

  const selectSuggestion = (item) => {
    // Format destination text clearly
    const parts = [item.name]
    if (item.state && (item.countryCode === 'US' || item.countryCode === 'CA' || item.countryCode === 'AU')) {
      parts.push(item.state)
    }
    if (item.countryName) {
      parts.push(item.countryName)
    }

    const formatted = parts.join(', ')
    setInputValue(formatted)
    onChange(formatted, {
      city: item.name,
      country: item.countryName || item.countryCode || '',
      latitude: item.lat,
      longitude: item.lon,
      state: item.state || '',
      countryCode: item.countryCode || '',
    })
    setIsOpen(false)
    setSuggestions([])
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault()
        selectSuggestion(suggestions[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setInputValue('')
    onChange('', null)
    setSuggestions([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-primary pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          autoComplete="off"
          className="w-full rounded-xl border border-border bg-background/50 pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {loading && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
          {!loading && inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-border bg-card shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 flex items-center justify-between">
            <span>Verified Destinations</span>
            <span className="text-[9px] font-normal normal-case">DeepSpace Geocoding</span>
          </div>

          <ul className="max-h-60 overflow-y-auto divide-y divide-border/30">
            {suggestions.map((item, idx) => {
              const isSelected = selectedIndex === idx
              const coords = formatCoords(item.lat, item.lon)

              return (
                <li
                  key={`${item.name}-${item.state}-${item.countryCode}-${idx}`}
                  onMouseDown={() => selectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold truncate flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.countryCode && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted/80 text-muted-foreground font-mono font-normal">
                            {item.countryCode}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {[item.state, item.countryName].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>

                  {coords && (
                    <div className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 rounded-full border border-border/40">
                      <Compass className="w-2.5 h-2.5 text-primary" />
                      <span>{coords}</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

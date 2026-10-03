import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { integration } from 'deepspace'
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSun,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  Thermometer,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react'

// Map OpenWeather icon code to Lucide fallback icons
function getWeatherIcon(iconCode, description = '') {
  if (!iconCode) return <Cloud className="w-6 h-6 text-sky-400" />
  const code = iconCode.slice(0, 2)
  switch (code) {
    case '01':
      return <Sun className="w-6 h-6 text-amber-400" />
    case '02':
      return <CloudSun className="w-6 h-6 text-amber-300" />
    case '03':
    case '04':
      return <Cloud className="w-6 h-6 text-slate-400" />
    case '09':
    case '10':
      return <CloudRain className="w-6 h-6 text-sky-400" />
    case '11':
      return <CloudLightning className="w-6 h-6 text-yellow-400" />
    case '13':
      return <Snowflake className="w-6 h-6 text-blue-200" />
    case '50':
      return <Wind className="w-6 h-6 text-teal-300" />
    default:
      return <Cloud className="w-6 h-6 text-sky-400" />
  }
}

export default function DestinationWeather({ destination }) {
  const [unit, setUnit] = useState('metric') // 'metric' (°C) or 'imperial' (°F)
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showForecast, setShowForecast] = useState(false)

  const fetchWeather = useCallback(
    async (targetUnit = unit) => {
      if (!destination || !destination.trim()) {
        setWeather(null)
        setForecast([])
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch current weather via DeepSpace integration proxy
        const currentWeatherResult = await integration.post('openweathermap/current', {
          q: destination.trim(),
          units: targetUnit,
        })

        if (!currentWeatherResult.success) {
          setError(
            currentWeatherResult.error ||
              `Could not find weather data for "${destination}". Check the destination spelling.`
          )
          setWeather(null)
          setForecast([])
          return
        }

        setWeather(currentWeatherResult.data)

        // Fetch 5-day forecast via DeepSpace integration proxy
        try {
          const forecastResult = await integration.post('openweathermap/forecast', {
            q: destination.trim(),
            units: targetUnit,
          })
          if (forecastResult.success && Array.isArray(forecastResult.data)) {
            setForecast(forecastResult.data)
          } else {
            setForecast([])
          }
        } catch {
          // If forecast fails, current weather is still displayed
          setForecast([])
        }
      } catch (err) {
        setError(err?.message || 'Failed to fetch weather data. Please try again.')
        setWeather(null)
      } finally {
        setLoading(false)
      }
    },
    [destination, unit]
  )

  useEffect(() => {
    fetchWeather(unit)
  }, [fetchWeather, unit])

  const toggleUnit = (newUnit) => {
    if (newUnit !== unit) {
      setUnit(newUnit)
    }
  }

  // Aggregate 3-hour forecasts into daily summaries
  const dailyForecast = useMemo(() => {
    if (!forecast || forecast.length === 0) return []

    const groups = {}
    forecast.forEach((item) => {
      if (!item.dt) return
      const date = new Date(item.dt * 1000)
      const dayKey = date.toISOString().split('T')[0]
      if (!groups[dayKey]) {
        groups[dayKey] = []
      }
      groups[dayKey].push(item)
    })

    const days = []
    const sortedKeys = Object.keys(groups).sort()

    sortedKeys.forEach((key) => {
      const items = groups[key]
      if (!items || items.length === 0) return

      const dateObj = new Date(items[0].dt * 1000)
      const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'short' })
      const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

      const temps = items.map((i) => i.temp).filter((t) => typeof t === 'number')
      const minTemp = temps.length > 0 ? Math.round(Math.min(...temps)) : null
      const maxTemp = temps.length > 0 ? Math.round(Math.max(...temps)) : null

      // Pick representative mid-day entry
      const midItem = items[Math.floor(items.length / 2)] || items[0]

      days.push({
        dayKey: key,
        weekday,
        date: formattedDate,
        minTemp,
        maxTemp,
        description: midItem.description || '',
        icon: midItem.icon || '',
      })
    })

    return days.slice(0, 5)
  }, [forecast])

  if (!destination || !destination.trim()) {
    return null
  }

  const tempSymbol = unit === 'metric' ? '°C' : '°F'
  const windUnit = unit === 'metric' ? 'm/s' : 'mph'

  return (
    <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-4 sm:p-5 shadow-sm transition-all mb-8">
      {/* Loading State */}
      {loading && !weather && (
        <div className="flex items-center justify-between gap-4 py-2 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted/60 rounded" />
            </div>
          </div>
          <div className="h-8 w-20 bg-muted rounded-xl" />
        </div>
      )}

      {/* Error State with in-place Retry */}
      {!loading && error && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-foreground">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">Weather Unavailable</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchWeather(unit)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Success State */}
      {weather && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Icon, Main Temp & Location */}
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 shrink-0 overflow-hidden">
                {weather.icon ? (
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.description || 'Weather condition'}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      // Fallback to lucide icon if image load fails
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.parentElement?.querySelector('.weather-icon-fallback')
                      if (fallback) fallback.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div
                  className={`weather-icon-fallback ${weather.icon ? 'hidden' : 'flex'} items-center justify-center`}
                >
                  {getWeatherIcon(weather.icon, weather.description)}
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {Math.round(weather.temp)}
                    {tempSymbol}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium capitalize">
                    {weather.description}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span className="truncate max-w-[200px]">{destination}</span>
                  </span>
                  <span>•</span>
                  <span>Feels like {Math.round(weather.feels_like)}{tempSymbol}</span>
                </div>
              </div>
            </div>

            {/* Middle: Key Weather Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-y sm:border-y-0 sm:border-x border-border/60 py-2 sm:py-0 sm:px-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Humidity: <strong className="text-foreground font-semibold">{weather.humidity}%</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Wind: <strong className="text-foreground font-semibold">{weather.wind_speed} {windUnit}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-2 sm:col-span-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Atm: <strong className="text-foreground font-semibold">{weather.pressure} hPa</strong></span>
              </div>
            </div>

            {/* Right: Controls (°C / °F toggle, 5-Day Forecast, Refresh) */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              {/* Unit Toggle */}
              <div className="inline-flex items-center p-0.5 rounded-xl border border-border bg-muted/60 text-xs">
                <button
                  type="button"
                  onClick={() => toggleUnit('metric')}
                  className={`px-2 py-1 rounded-lg font-medium transition-all ${
                    unit === 'metric'
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  °C
                </button>
                <button
                  type="button"
                  onClick={() => toggleUnit('imperial')}
                  className={`px-2 py-1 rounded-lg font-medium transition-all ${
                    unit === 'imperial'
                      ? 'bg-card text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  °F
                </button>
              </div>

              {/* 5-Day Forecast Toggle */}
              {dailyForecast.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForecast((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background/50 hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
                >
                  <span>5-Day Forecast</span>
                  {showForecast ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Refresh button */}
              <button
                type="button"
                onClick={() => fetchWeather(unit)}
                disabled={loading}
                title="Refresh weather"
                className="p-1.5 rounded-xl border border-border bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expandable 5-Day Forecast Strip */}
          {showForecast && dailyForecast.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/60 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="text-xs font-semibold text-muted-foreground mb-3 flex items-center justify-between">
                <span>5-Day Destination Forecast</span>
                <span className="text-[11px] font-normal">Updated live from OpenWeatherMap</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {dailyForecast.map((day) => (
                  <div
                    key={day.dayKey}
                    className="flex flex-col items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/40 text-center hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-xs font-bold text-foreground">{day.weekday}</span>
                    <span className="text-[10px] text-muted-foreground">{day.date}</span>

                    <div className="my-1.5">
                      {day.icon ? (
                        <img
                          src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                          alt={day.description}
                          className="w-9 h-9 object-contain"
                        />
                      ) : (
                        getWeatherIcon(day.icon, day.description)
                      )}
                    </div>

                    <span className="text-[11px] text-muted-foreground capitalize line-clamp-1 mb-1">
                      {day.description}
                    </span>

                    <div className="text-xs font-semibold text-foreground">
                      <span>{day.maxTemp}{tempSymbol}</span>
                      {day.minTemp !== null && day.minTemp !== day.maxTemp && (
                        <span className="text-muted-foreground font-normal ml-1">/ {day.minTemp}{tempSymbol}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

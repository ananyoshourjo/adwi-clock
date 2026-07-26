import { useEffect, useRef, useState } from 'react'
import * as Location from 'expo-location'
import {
  Animated,
  Easing,
  Image,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native'

type WeatherKind =
  | 'sun'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm'
  | 'stormHail'
type TimeModifier = 'day' | 'night'
export type WeatherThemeKey = `${WeatherKind}-${TimeModifier}`

export type WeatherPalette = {
  key: WeatherThemeKey
  label: string
  background: string
  text: string
  muted: string
  tabTrack: string
  activeTab: string
  activeTabText: string
  control: string
  controlMuted: string
  primary: string
  primaryText: string
  selectorSurface: string
  selectorBorder: string
}

type PrecipitationDrop = {
  key: string
  leftRatio: number
  delay: number
  duration: number
  length: number
  opacity: number
  width: number
}

type SnowFlake = {
  key: string
  leftRatio: number
  delay: number
  duration: number
  size: number
  opacity: number
  drift: number
}

const WEATHER_REFRESH_MS = 20 * 60 * 1000

const WEATHER_PALETTES: WeatherPalette[] = [
  {
    key: 'sun-day',
    label: 'Sun / Day',
    background: '#f7e7bd',
    text: '#261d13',
    muted: '#695640',
    tabTrack: '#ead4a4',
    activeTab: '#d9bd81',
    activeTabText: '#34291b',
    control: '#ead8b5',
    controlMuted: '#b8a98d',
    primary: '#c84f25',
    primaryText: '#fff8ec',
    selectorSurface: '#fff1ce',
    selectorBorder: '#d7b979',
  },
  {
    key: 'sun-night',
    label: 'Sun / Night',
    background: '#101926',
    text: '#ffe9bd',
    muted: '#b7a78d',
    tabTrack: '#202b38',
    activeTab: '#3c4652',
    activeTabText: '#ffe4ad',
    control: '#26313f',
    controlMuted: '#566170',
    primary: '#d87938',
    primaryText: '#fff6e7',
    selectorSurface: '#182434',
    selectorBorder: '#4d3f2a',
  },
  {
    key: 'cloud-day',
    label: 'Cloud / Day',
    background: '#e5e2d8',
    text: '#242522',
    muted: '#66675f',
    tabTrack: '#d6d2c6',
    activeTab: '#c2beb2',
    activeTabText: '#2f312d',
    control: '#d4d0c4',
    controlMuted: '#aaa69b',
    primary: '#6f7d76',
    primaryText: '#fbf7ed',
    selectorSurface: '#efebe0',
    selectorBorder: '#c4bdae',
  },
  {
    key: 'cloud-night',
    label: 'Cloud / Night',
    background: '#1b2229',
    text: '#e8e2d6',
    muted: '#a7a59e',
    tabTrack: '#293039',
    activeTab: '#3b434d',
    activeTabText: '#e1d7c6',
    control: '#303743',
    controlMuted: '#5b636d',
    primary: '#88968f',
    primaryText: '#101416',
    selectorSurface: '#232b34',
    selectorBorder: '#525963',
  },
  {
    key: 'fog-day',
    label: 'Fog / Day',
    background: '#e7e4dc',
    text: '#2d302c',
    muted: '#6d746e',
    tabTrack: '#d5d5cd',
    activeTab: '#c0c7be',
    activeTabText: '#303731',
    control: '#d7d8cf',
    controlMuted: '#a6aaa2',
    primary: '#667a72',
    primaryText: '#fbfaf4',
    selectorSurface: '#f1eee7',
    selectorBorder: '#c6c9c0',
  },
  {
    key: 'fog-night',
    label: 'Fog / Night',
    background: '#171d1d',
    text: '#dfe4dc',
    muted: '#a1aaa2',
    tabTrack: '#242b2a',
    activeTab: '#36413e',
    activeTabText: '#d4ddd5',
    control: '#2b3331',
    controlMuted: '#59635d',
    primary: '#8da79c',
    primaryText: '#101514',
    selectorSurface: '#202827',
    selectorBorder: '#53605b',
  },
  {
    key: 'drizzle-day',
    label: 'Drizzle / Day',
    background: '#dde9e7',
    text: '#1d2d2f',
    muted: '#5e7374',
    tabTrack: '#c9dddc',
    activeTab: '#a9cdcc',
    activeTabText: '#18383b',
    control: '#c9dcda',
    controlMuted: '#9bb1b0',
    primary: '#287f86',
    primaryText: '#f4fffd',
    selectorSurface: '#edf6f4',
    selectorBorder: '#aecbc8',
  },
  {
    key: 'drizzle-night',
    label: 'Drizzle / Night',
    background: '#101e24',
    text: '#d3ecec',
    muted: '#9ab7b8',
    tabTrack: '#1e3037',
    activeTab: '#344b54',
    activeTabText: '#bce7e8',
    control: '#263941',
    controlMuted: '#58707a',
    primary: '#4ea7ad',
    primaryText: '#071316',
    selectorSurface: '#182932',
    selectorBorder: '#456875',
  },
  {
    key: 'rain-day',
    label: 'Rain / Day',
    background: '#d7e3dd',
    text: '#172d34',
    muted: '#536e75',
    tabTrack: '#c2d5d2',
    activeTab: '#9ebebd',
    activeTabText: '#17383f',
    control: '#c5d6d2',
    controlMuted: '#95aaa9',
    primary: '#236f7a',
    primaryText: '#f4fffe',
    selectorSurface: '#e7f0ec',
    selectorBorder: '#a8c0bd',
  },
  {
    key: 'rain-night',
    label: 'Rain / Night',
    background: '#0c1720',
    text: '#d7edf0',
    muted: '#91afba',
    tabTrack: '#182936',
    activeTab: '#2c4858',
    activeTabText: '#b8dce5',
    control: '#203443',
    controlMuted: '#4d6878',
    primary: '#2d819c',
    primaryText: '#f0fcff',
    selectorSurface: '#142330',
    selectorBorder: '#3f6273',
  },
  {
    key: 'snow-day',
    label: 'Snow / Day',
    background: '#f2f6f4',
    text: '#172329',
    muted: '#61747b',
    tabTrack: '#dde9e9',
    activeTab: '#c5dcdf',
    activeTabText: '#214a55',
    control: '#e2eceb',
    controlMuted: '#aebfc2',
    primary: '#4c91a8',
    primaryText: '#f8ffff',
    selectorSurface: '#fbfefd',
    selectorBorder: '#c9d9dc',
  },
  {
    key: 'snow-night',
    label: 'Snow / Night',
    background: '#111a24',
    text: '#e8f4f7',
    muted: '#afc4cc',
    tabTrack: '#1f2b38',
    activeTab: '#344656',
    activeTabText: '#d4eaf3',
    control: '#2a3745',
    controlMuted: '#596c7b',
    primary: '#7bafc6',
    primaryText: '#091319',
    selectorSurface: '#1a2633',
    selectorBorder: '#4d6473',
  },
  {
    key: 'storm-day',
    label: 'Storm / Day',
    background: '#d8d3c5',
    text: '#19161c',
    muted: '#5c5962',
    tabTrack: '#c7c0b3',
    activeTab: '#b4ac9f',
    activeTabText: '#2b2633',
    control: '#c9c1b5',
    controlMuted: '#9d968d',
    primary: '#5a344b',
    primaryText: '#fff4e7',
    selectorSurface: '#e7e1d3',
    selectorBorder: '#b9ad9c',
  },
  {
    key: 'storm-night',
    label: 'Storm / Night',
    background: '#0c0d14',
    text: '#efe5d2',
    muted: '#b5a996',
    tabTrack: '#1b1a25',
    activeTab: '#332f3d',
    activeTabText: '#e6c77f',
    control: '#252431',
    controlMuted: '#5b5868',
    primary: '#8b4b51',
    primaryText: '#fff4e8',
    selectorSurface: '#161721',
    selectorBorder: '#554a45',
  },
  {
    key: 'stormHail-day',
    label: 'Storm Hail / Day',
    background: '#dde5e7',
    text: '#141b20',
    muted: '#5d6b72',
    tabTrack: '#c9d5d9',
    activeTab: '#b4c3cc',
    activeTabText: '#253647',
    control: '#cbd7db',
    controlMuted: '#9aa9b0',
    primary: '#526d8e',
    primaryText: '#f9fdff',
    selectorSurface: '#ebf1f2',
    selectorBorder: '#b3c2c8',
  },
  {
    key: 'stormHail-night',
    label: 'Storm Hail / Night',
    background: '#0b1018',
    text: '#eaf0f4',
    muted: '#b1bfcb',
    tabTrack: '#181f2b',
    activeTab: '#303b4c',
    activeTabText: '#d1e2eb',
    control: '#222b38',
    controlMuted: '#556272',
    primary: '#697fa8',
    primaryText: '#f8fbff',
    selectorSurface: '#141b26',
    selectorBorder: '#46566d',
  },
]

export const WEATHER_PALETTE_BY_KEY = WEATHER_PALETTES.reduce(
  (themes, palette) => ({ ...themes, [palette.key]: palette }),
  {} as Record<WeatherThemeKey, WeatherPalette>
)

type WeatherApiResponse = {
  current?: {
    is_day?: number
    weather_code?: number
  }
}

function getFallbackTimeModifier(): TimeModifier {
  const hour = new Date().getHours()

  return hour >= 6 && hour < 18 ? 'day' : 'night'
}

function mapWeatherCodeToKind(code: number): WeatherKind {
  if (code === 96 || code === 99) {
    return 'stormHail'
  }

  if (code >= 95) {
    return 'storm'
  }

  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return 'snow'
  }

  if (code === 45 || code === 48) {
    return 'fog'
  }

  if ((code >= 51 && code <= 57) || code === 66 || code === 67) {
    return 'drizzle'
  }

  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) {
    return 'rain'
  }

  if (code >= 1 && code <= 3) {
    return 'cloud'
  }

  return 'sun'
}

async function getWeatherThemeFromLocation(): Promise<WeatherThemeKey> {
  const permission = await Location.requestForegroundPermissionsAsync()

  if (permission.status !== 'granted') {
    return `sun-${getFallbackTimeModifier()}`
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  })
  const { latitude, longitude } = position.coords
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,is_day&timezone=auto`
  )

  if (!response.ok) {
    throw new Error(`Weather request failed with ${response.status}`)
  }

  const data = (await response.json()) as WeatherApiResponse
  const weatherCode = data.current?.weather_code
  const isDay = data.current?.is_day
  const weatherKind = typeof weatherCode === 'number'
    ? mapWeatherCodeToKind(weatherCode)
    : 'sun'
  const timeModifier: TimeModifier = isDay === 0
    ? 'night'
    : isDay === 1
      ? 'day'
      : getFallbackTimeModifier()

  return `${weatherKind}-${timeModifier}`
}

export function useWeatherThemeKey() {
  const [weatherThemeKey, setWeatherThemeKey] = useState<WeatherThemeKey>(
    `sun-${getFallbackTimeModifier()}`
  )
  const manualThemeOverride = useRef(false)

  const cycleWeatherTheme = () => {
    manualThemeOverride.current = true
    Vibration.vibrate(12)

    setWeatherThemeKey((currentThemeKey) => {
      const currentIndex = WEATHER_PALETTES.findIndex(
        (palette) => palette.key === currentThemeKey
      )
      const nextIndex = currentIndex === -1
        ? 0
        : (currentIndex + 1) % WEATHER_PALETTES.length

      return WEATHER_PALETTES[nextIndex].key
    })
  }

  useEffect(() => {
    let active = true

    const updateWeatherTheme = async () => {
      try {
        const nextThemeKey = await getWeatherThemeFromLocation()

        if (active && !manualThemeOverride.current) {
          setWeatherThemeKey(nextThemeKey)
        }
      } catch {
        if (active && !manualThemeOverride.current) {
          setWeatherThemeKey(`sun-${getFallbackTimeModifier()}`)
        }
      }
    }

    updateWeatherTheme()
    const id = setInterval(updateWeatherTheme, WEATHER_REFRESH_MS)

    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return { weatherThemeKey, cycleWeatherTheme }
}

const RAIN_DAY_DROPS = Array.from({ length: 58 }, (_, index) => ({
  key: `rain-day-drop-${index}`,
  leftRatio: ((index * 19) % 116) / 100,
  delay: (index * 91) % 950,
  duration: 820 + ((index * 67) % 420),
  length: 32 + ((index * 13) % 24),
  opacity: 0.1 + ((index % 5) * 0.022),
  width: index % 4 === 0 ? 2 : 1,
}))

const RAIN_NIGHT_DROPS = Array.from({ length: 64 }, (_, index) => ({
  key: `rain-night-drop-${index}`,
  leftRatio: ((index * 17) % 118) / 100,
  delay: (index * 83) % 900,
  duration: 780 + ((index * 59) % 380),
  length: 34 + ((index * 11) % 28),
  opacity: 0.08 + ((index % 5) * 0.018),
  width: index % 5 === 0 ? 2 : 1,
}))

const DRIZZLE_DAY_DROPS: PrecipitationDrop[] = Array.from({ length: 34 }, (_, index) => ({
  key: `drizzle-day-drop-${index}`,
  leftRatio: ((index * 29) % 112) / 100,
  delay: (index * 97) % 950,
  duration: 1120 + ((index * 47) % 420),
  length: 22 + ((index * 7) % 16),
  opacity: 0.16 + ((index % 4) * 0.026),
  width: 1,
}))

const DRIZZLE_NIGHT_DROPS: PrecipitationDrop[] = Array.from({ length: 44 }, (_, index) => ({
  key: `drizzle-night-drop-${index}`,
  leftRatio: ((index * 31) % 114) / 100,
  delay: (index * 89) % 900,
  duration: 1060 + ((index * 43) % 380),
  length: 22 + ((index * 5) % 16),
  opacity: 0.11 + ((index % 4) * 0.022),
  width: 1,
}))

const SNOW_DAY_FLAKES: SnowFlake[] = Array.from({ length: 64 }, (_, index) => ({
  key: `snow-day-flake-${index}`,
  leftRatio: ((index * 23) % 108) / 100,
  delay: (index * 83) % 850,
  duration: 3400 + ((index * 127) % 1800),
  size: 4 + (index % 4),
  opacity: 0.38 + ((index % 5) * 0.07),
  drift: index % 2 === 0 ? 28 + (index % 5) * 8 : -24 - (index % 5) * 7,
}))

const SNOW_NIGHT_FLAKES: SnowFlake[] = Array.from({ length: 48 }, (_, index) => ({
  key: `snow-night-flake-${index}`,
  leftRatio: ((index * 19) % 110) / 100,
  delay: (index * 137) % 1350,
  duration: 4100 + ((index * 113) % 2200),
  size: 2 + (index % 4),
  opacity: 0.18 + ((index % 5) * 0.045),
  drift: index % 2 === 0 ? 24 + (index % 5) * 7 : -22 - (index % 5) * 6,
}))

const HAIL_DAY_FLAKES: SnowFlake[] = Array.from({ length: 24 }, (_, index) => ({
  key: `hail-day-flake-${index}`,
  leftRatio: ((index * 37) % 112) / 100,
  delay: (index * 113) % 1500,
  duration: 1400 + ((index * 61) % 620),
  size: 3 + (index % 3),
  opacity: 0.18 + ((index % 4) * 0.035),
  drift: index % 2 === 0 ? 14 + (index % 4) * 4 : -12 - (index % 4) * 4,
}))

const HAIL_NIGHT_FLAKES: SnowFlake[] = Array.from({ length: 28 }, (_, index) => ({
  key: `hail-night-flake-${index}`,
  leftRatio: ((index * 31) % 114) / 100,
  delay: (index * 101) % 1400,
  duration: 1260 + ((index * 53) % 560),
  size: 2 + (index % 3),
  opacity: 0.13 + ((index % 4) * 0.03),
  drift: index % 2 === 0 ? 12 + (index % 4) * 4 : -10 - (index % 4) * 4,
}))

const STORM_DAY_DROPS: PrecipitationDrop[] = Array.from({ length: 88 }, (_, index) => ({
  key: `storm-day-drop-${index}`,
  leftRatio: ((index * 13) % 120) / 100,
  delay: (index * 53) % 620,
  duration: 560 + ((index * 47) % 300),
  length: 42 + ((index * 11) % 34),
  opacity: 0.14 + ((index % 5) * 0.028),
  width: index % 3 === 0 ? 2 : 1,
}))

const STORM_NIGHT_DROPS: PrecipitationDrop[] = Array.from({ length: 94 }, (_, index) => ({
  key: `storm-night-drop-${index}`,
  leftRatio: ((index * 11) % 122) / 100,
  delay: (index * 47) % 580,
  duration: 520 + ((index * 43) % 280),
  length: 44 + ((index * 13) % 36),
  opacity: 0.1 + ((index % 5) * 0.024),
  width: index % 3 === 0 ? 2 : 1,
}))

function RainAtmosphere({
  drops,
  color,
  rotate = '14deg',
  xStartRatio = 0.2,
  xEndRatio = -0.15,
}: {
  drops: PrecipitationDrop[]
  color: string
  rotate?: string
  xStartRatio?: number
  xEndRatio?: number
}) {
  const { width, height } = useWindowDimensions()
  const dropProgress = useRef(
    drops.map(() => new Animated.Value(0))
  ).current

  useEffect(() => {
    const animations = dropProgress.map((progress, index) => {
      const drop = drops[index]
      progress.setValue(0)

      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(drop.delay),
          Animated.timing(progress, {
            toValue: 1,
            duration: drop.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )

      animation.start()
      return animation
    })

    return () => {
      animations.forEach((animation) => animation.stop())
    }
  }, [dropProgress, drops])

  return (
    <View
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      {drops.map((drop, index) => {
        const progress = dropProgress[index]
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-150, height + 150],
        })
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [width * xStartRatio, width * xEndRatio],
        })

        return (
          <Animated.View
            key={drop.key}
            style={{
              position: 'absolute',
              left: width * drop.leftRatio - 56,
              top: -80,
              width: drop.width,
              height: drop.length,
              borderRadius: 999,
              backgroundColor: color,
              opacity: drop.opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        )
      })}
    </View>
  )
}

function SnowAtmosphere({
  flakes,
  color,
}: {
  flakes: SnowFlake[]
  color: string
}) {
  const { width, height } = useWindowDimensions()
  const flakeProgress = useRef(
    flakes.map(() => new Animated.Value(0))
  ).current

  useEffect(() => {
    const animations = flakeProgress.map((progress, index) => {
      const flake = flakes[index]
      progress.setValue(0)

      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(flake.delay),
          Animated.timing(progress, {
            toValue: 1,
            duration: flake.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )

      animation.start()
      return animation
    })

    return () => {
      animations.forEach((animation) => animation.stop())
    }
  }, [flakeProgress, flakes])

  return (
    <View
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      {flakes.map((flake, index) => {
        const progress = flakeProgress[index]
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-80, height + 90],
        })
        const translateX = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, flake.drift, -flake.drift * 0.35],
        })

        return (
          <Animated.View
            key={flake.key}
            style={{
              position: 'absolute',
              left: width * flake.leftRatio - 20,
              top: -40,
              width: flake.size,
              height: flake.size,
              borderRadius: flake.size / 2,
              backgroundColor: color,
              opacity: flake.opacity,
              transform: [{ translateX }, { translateY }],
            }}
          />
        )
      })}
    </View>
  )
}

function DriftBandAtmosphere({
  variant,
}: {
  variant: 'cloud-day' | 'cloud-night' | 'fog-day' | 'fog-night'
}) {
  const { width } = useWindowDimensions()
  const drift = useRef(new Animated.Value(0)).current
  const atmosphereAsset =
    variant === 'cloud-day'
      ? require('../assets/weather-cloud-day.png')
      : variant === 'cloud-night'
        ? require('../assets/weather-cloud-night.png')
        : variant === 'fog-day'
          ? require('../assets/weather-fog-day.png')
          : require('../assets/weather-fog-night.png')

  useEffect(() => {
    drift.setValue(0)
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: variant.startsWith('fog') ? 14500 : 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: variant.startsWith('fog') ? 14500 : 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    )

    animation.start()

    return () => animation.stop()
  }, [drift, variant])

  const isFog = variant.startsWith('fog')
  const translateX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: isFog ? [-width * 0.08, width * 0.08] : [-width * 0.12, width * 0.1],
  })

  return (
    <View
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      <Animated.Image
        source={atmosphereAsset}
        style={{
          position: 'absolute',
          top: isFog ? -18 : -28,
          left: -180,
          width: width + 360,
          height: isFog ? 940 : 880,
          opacity: 1,
          transform: [{ translateX }],
        }}
      />
    </View>
  )
}

function StormFlash({ night = false }: { night?: boolean }) {
  const flash = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(night ? 3600 : 4300),
        Animated.timing(flash, {
          toValue: night ? 0.18 : 0.12,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flash, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(night ? 6200 : 7600),
      ])
    )

    animation.start()

    return () => animation.stop()
  }, [flash, night])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: night ? '#c8d7ff' : '#fff4c6',
        opacity: flash,
      }}
    />
  )
}

export function WeatherAtmosphere({ paletteKey }: { paletteKey: WeatherThemeKey }) {
  const isSunNight = paletteKey === 'sun-night'
  const atmosphereAsset =
    paletteKey === 'sun-day'
      ? require('../assets/sun-day-glow.png')
      : isSunNight
        ? require('../assets/sun-night-glow.png')
        : null

  if (paletteKey === 'rain-day') {
    return <RainAtmosphere key={paletteKey} drops={RAIN_DAY_DROPS} color="#5f8f9a" />
  }

  if (paletteKey === 'rain-night') {
    return <RainAtmosphere key={paletteKey} drops={RAIN_NIGHT_DROPS} color="#95c4d3" />
  }

  if (paletteKey === 'drizzle-day') {
    return (
      <RainAtmosphere
        key={paletteKey}
        drops={DRIZZLE_DAY_DROPS}
        color="#6fa5a6"
        rotate="5deg"
        xStartRatio={0.04}
        xEndRatio={-0.04}
      />
    )
  }

  if (paletteKey === 'drizzle-night') {
    return (
      <RainAtmosphere
        key={paletteKey}
        drops={DRIZZLE_NIGHT_DROPS}
        color="#9bcfd1"
        rotate="5deg"
        xStartRatio={0.04}
        xEndRatio={-0.04}
      />
    )
  }

  if (paletteKey === 'cloud-day' || paletteKey === 'cloud-night') {
    return <DriftBandAtmosphere variant={paletteKey} />
  }

  if (paletteKey === 'fog-day' || paletteKey === 'fog-night') {
    return <DriftBandAtmosphere variant={paletteKey} />
  }

  if (paletteKey === 'snow-day') {
    return <SnowAtmosphere key={paletteKey} flakes={SNOW_DAY_FLAKES} color="#ffffff" />
  }

  if (paletteKey === 'snow-night') {
    return <SnowAtmosphere key={paletteKey} flakes={SNOW_NIGHT_FLAKES} color="#d8edf5" />
  }

  if (paletteKey === 'storm-day') {
    return (
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none' }}>
        <RainAtmosphere
          key={`${paletteKey}-rain`}
          drops={STORM_DAY_DROPS}
          color="#59646e"
          rotate="16deg"
          xStartRatio={0.24}
          xEndRatio={-0.18}
        />
        <StormFlash />
      </View>
    )
  }

  if (paletteKey === 'storm-night') {
    return (
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none' }}>
        <RainAtmosphere
          key={`${paletteKey}-rain`}
          drops={STORM_NIGHT_DROPS}
          color="#7d8aa3"
          rotate="16deg"
          xStartRatio={0.25}
          xEndRatio={-0.2}
        />
        <StormFlash night />
      </View>
    )
  }

  if (paletteKey === 'stormHail-day') {
    return (
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none' }}>
        <RainAtmosphere
          key={`${paletteKey}-rain`}
          drops={STORM_DAY_DROPS}
          color="#607887"
          rotate="16deg"
          xStartRatio={0.24}
          xEndRatio={-0.18}
        />
        <SnowAtmosphere key={`${paletteKey}-hail`} flakes={HAIL_DAY_FLAKES} color="#f4fbff" />
        <StormFlash />
      </View>
    )
  }

  if (paletteKey === 'stormHail-night') {
    return (
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none' }}>
        <RainAtmosphere
          key={`${paletteKey}-rain`}
          drops={STORM_NIGHT_DROPS}
          color="#738ba4"
          rotate="16deg"
          xStartRatio={0.25}
          xEndRatio={-0.2}
        />
        <SnowAtmosphere key={`${paletteKey}-hail`} flakes={HAIL_NIGHT_FLAKES} color="#d9edf8" />
        <StormFlash night />
      </View>
    )
  }

  if (!atmosphereAsset) {
    return null
  }

  return (
    <View
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      <Image
        source={atmosphereAsset}
        style={{
          position: 'absolute',
          top: isSunNight ? -236 : -194,
          right: isSunNight ? -304 : -250,
          width: 780,
          height: 780,
          opacity: isSunNight ? 0.82 : 1,
        }}
      />
    </View>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular'
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio'
import {
  Animated,
  AppState,
  Easing,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native'
import { TamaguiProvider } from '@tamagui/web'
import { Button } from '@tamagui/button'
import { XStack, YStack } from '@tamagui/stacks'

import { tamaguiConfig } from './tamagui.config'
import {
  CircleMinus,
  CirclePlus,
  Hourglass,
  RotateCw,
  Timer,
} from './lucide-icons'
import { CharacterScene } from './src/components/CharacterScene'
import {
  PrimaryButtonLabel,
  RollingClockDisplay,
} from './src/components/ClockDisplay'
import type { ClockMotionDirection } from './src/components/ClockDisplay'
import { formatDuration } from './src/utils/time'
import {
  useWeatherThemeKey,
  WEATHER_PALETTE_BY_KEY,
  WeatherAtmosphere,
} from './src/weather'

type Mode = 'stopwatch' | 'timer'

const TIMER_STEP_SECONDS = 60
const TIMER_HOLD_STEP_SECONDS = 10 * TIMER_STEP_SECONDS
const TIMER_HOLD_DELAY_MS = 600
const TIMER_HOLD_REPEAT_MS = 650
const TIMER_COMPLETE_VIBRATION_PATTERN = [0, 650, 180, 700, 180, 950]
const TIMER_COMPLETE_CHIME = require('./assets/timer-complete-chime.wav')
const TButton = Button as any
const TXStack = XStack as any
const TYStack = YStack as any
const TAB_ICON_SIZE = 24
const CONTROL_ICON_SIZE = 24
const TAB_BUTTON_SIZE = 64
const TAB_BUTTON_HEIGHT = 48
const TAB_BUTTON_GAP = 6
const TAB_TRACK_PADDING = 6
const TAB_SWITCH_DURATION = 240
const TIMER_SIDE_CONTROLS_DURATION = 180
const CONTROL_BUTTON_SIZE = 64
const FULL_RADIUS = 999
const MAX_CONTENT_WIDTH = 430
const CLOCK_CHARACTER_WIDTH_RATIO = 0.84
const MIN_CLOCK_FONT_SIZE = 46
const MAX_CLOCK_FONT_SIZE = 124
const MIN_CONTENT_PADDING = 22
const TOP_PADDING = 156
const COMPACT_TOP_PADDING = 78
const SCENE_HEIGHT = 246

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function ClockApp() {
  const { height, width } = useWindowDimensions()
  const timerCompletePlayer = useAudioPlayer(TIMER_COMPLETE_CHIME)
  const [mode, setMode] = useState<Mode>('stopwatch')
  const { weatherThemeKey, cycleWeatherTheme } = useWeatherThemeKey()
  const [stopwatchMs, setStopwatchMs] = useState(0)
  const [stopwatchRunning, setStopwatchRunning] = useState(false)
  const stopwatchStartedAt = useRef<number | null>(null)
  const stopwatchBaseMs = useRef(0)

  const [timerSeconds, setTimerSeconds] = useState(5 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerEndsAt = useRef<number | null>(null)
  const timerFinishAlerted = useRef(false)
  const timerHoldTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerHoldInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const skipNextTimerPress = useRef(false)
  const tabProgress = useRef(new Animated.Value(0)).current
  const timerSideControlsProgress = useRef(new Animated.Value(0)).current
  const primaryPressProgress = useRef(new Animated.Value(0)).current
  const clockMotionValue = mode === 'stopwatch'
    ? Math.floor(stopwatchMs / 1000)
    : timerSeconds
  const previousClockMotionValue = useRef(clockMotionValue)
  const clockMotionDirection: ClockMotionDirection =
    clockMotionValue >= previousClockMotionValue.current ? 1 : -1

  useEffect(() => {
    Animated.timing(tabProgress, {
      toValue: mode === 'stopwatch' ? 0 : 1,
      duration: TAB_SWITCH_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [mode, tabProgress])

  useEffect(() => {
    Animated.timing(timerSideControlsProgress, {
      toValue: mode === 'timer' ? 1 : 0,
      duration: TIMER_SIDE_CONTROLS_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [mode, timerSideControlsProgress])

  useEffect(() => {
    previousClockMotionValue.current = clockMotionValue
  }, [clockMotionValue])

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    })
  }, [])

  const completeTimer = () => {
    setTimerSeconds(0)
    setTimerRunning(false)
    timerEndsAt.current = null

    if (!timerFinishAlerted.current) {
      timerFinishAlerted.current = true
      Vibration.vibrate(TIMER_COMPLETE_VIBRATION_PATTERN)

      try {
        timerCompletePlayer.seekTo(0)
        timerCompletePlayer.play()
      } catch {
        // Audio can be unavailable on some devices; vibration still signals completion.
      }
    }
  }

  useEffect(() => {
    if (!stopwatchRunning) {
      return
    }

    stopwatchStartedAt.current = Date.now()
    stopwatchBaseMs.current = stopwatchMs

    const id = setInterval(() => {
      if (stopwatchStartedAt.current === null) {
        return
      }

      setStopwatchMs(stopwatchBaseMs.current + Date.now() - stopwatchStartedAt.current)
    }, 40)

    return () => clearInterval(id)
  }, [stopwatchRunning])

  useEffect(() => {
    if (!timerRunning) {
      return
    }

    timerEndsAt.current = Date.now() + timerSeconds * 1000

    const id = setInterval(() => {
      if (timerEndsAt.current === null) {
        return
      }

      const remaining = Math.ceil((timerEndsAt.current - Date.now()) / 1000)

      if (remaining <= 0) {
        completeTimer()
        return
      }

      setTimerSeconds(remaining)
    }, 250)

    return () => clearInterval(id)
  }, [timerRunning])

  useEffect(() => {
    const syncRunningClocks = () => {
      const now = Date.now()

      if (stopwatchRunning && stopwatchStartedAt.current !== null) {
        setStopwatchMs(stopwatchBaseMs.current + now - stopwatchStartedAt.current)
      }

      if (!timerRunning || timerEndsAt.current === null) {
        return
      }

      const remaining = Math.ceil((timerEndsAt.current - now) / 1000)

      if (remaining <= 0) {
        completeTimer()
        return
      }

      setTimerSeconds(remaining)
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        syncRunningClocks()
      }
    })

    return () => subscription.remove()
  }, [stopwatchRunning, timerRunning])

  const display = useMemo(() => {
    if (mode === 'stopwatch') {
      return formatDuration(stopwatchMs / 1000)
    }

    return formatDuration(timerSeconds)
  }, [mode, stopwatchMs, timerSeconds])

  const adjustTimer = (delta: number) => {
    if (timerRunning) {
      return
    }

    setTimerSeconds((current) => {
      const nextSeconds = Math.max(0, current + delta)

      if (nextSeconds > 0) {
        timerFinishAlerted.current = false
      }

      return nextSeconds
    })
  }

  const stopTimerHoldRepeat = () => {
    if (timerHoldTimeout.current !== null) {
      clearTimeout(timerHoldTimeout.current)
      timerHoldTimeout.current = null
    }

    if (timerHoldInterval.current !== null) {
      clearInterval(timerHoldInterval.current)
      timerHoldInterval.current = null
    }
  }

  const startTimerHoldRepeat = (direction: 1 | -1) => {
    if (mode !== 'timer' || timerRunning) {
      return
    }

    stopTimerHoldRepeat()

    timerHoldTimeout.current = setTimeout(() => {
      skipNextTimerPress.current = true
      adjustTimer(direction * TIMER_HOLD_STEP_SECONDS)

      timerHoldInterval.current = setInterval(() => {
        adjustTimer(direction * TIMER_HOLD_STEP_SECONDS)
      }, TIMER_HOLD_REPEAT_MS)
    }, TIMER_HOLD_DELAY_MS)
  }

  const handleTimerStepPress = (direction: 1 | -1) => {
    if (skipNextTimerPress.current) {
      skipNextTimerPress.current = false
      return
    }

    adjustTimer(direction * TIMER_STEP_SECONDS)
  }

  useEffect(() => stopTimerHoldRepeat, [])

  const resetCurrentMode = () => {
    if (mode === 'stopwatch') {
      setStopwatchRunning(false)
      setStopwatchMs(0)
      stopwatchStartedAt.current = null
      stopwatchBaseMs.current = 0
      return
    }

    setTimerRunning(false)
    setTimerSeconds(5 * 60)
    timerEndsAt.current = null
    timerFinishAlerted.current = false
  }

  const compactVerticalLayout = height < 700 || width < 360
  const crampedVerticalLayout = height < 620
  const contentPadding = clamp(Math.round(width * 0.065), MIN_CONTENT_PADDING, 28)
  const contentWidth = Math.min(MAX_CONTENT_WIDTH, width - contentPadding * 2)
  const sceneScale = clamp(Math.min(width / 390, height / 760), 0.72, 1)
  const sceneHeight = Math.round(SCENE_HEIGHT * sceneScale)
  const reservedBottomSpace = sceneHeight + clamp(Math.round(height * 0.035), 16, 30)
  const clockMaxFontSize = crampedVerticalLayout ? 82 : compactVerticalLayout ? 98 : MAX_CLOCK_FONT_SIZE
  const numberFontSize = clamp(
    Math.floor(contentWidth / (display.length * CLOCK_CHARACTER_WIDTH_RATIO)),
    MIN_CLOCK_FONT_SIZE,
    clockMaxFontSize
  )
  const numberLineHeight = Math.round(numberFontSize * 1.08)
  const topPadding = clamp(
    Math.round(height * (crampedVerticalLayout ? 0.1 : compactVerticalLayout ? 0.13 : 0.18)),
    COMPACT_TOP_PADDING,
    TOP_PADDING
  )
  const minClockTop = topPadding + TAB_BUTTON_HEIGHT + TAB_TRACK_PADDING * 2 + 48
  const maxClockTop = Math.max(minClockTop, height - reservedBottomSpace - 220)
  const numberBlockTop = clamp(Math.round(height * 0.34), minClockTop, maxClockTop)
  const activeControlButtonSize = clamp(Math.round(width * 0.14), 44, CONTROL_BUTTON_SIZE)
  const activeControlIconSize = clamp(Math.round(activeControlButtonSize * 0.38), 18, CONTROL_ICON_SIZE)
  const primaryButtonHeight = clamp(Math.round(height * 0.074), 48, 72)
  const controlGap = compactVerticalLayout ? '$2' : '$4'
  const displayGap = compactVerticalLayout ? '$3' : '$5'
  const primaryButtonWidth = Math.min(contentWidth, 376)
  const palette = WEATHER_PALETTE_BY_KEY[weatherThemeKey]
  const statusBarStyle = weatherThemeKey.endsWith('-night') ? 'light' : 'dark'
  const activeTabTranslateX = tabProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TAB_BUTTON_SIZE + TAB_BUTTON_GAP],
  })
  const timerSideControlOpacity = timerSideControlsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })
  const timerSideControlScale = timerSideControlsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  })
  const decreaseControlTranslateX = timerSideControlsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  })
  const increaseControlTranslateX = timerSideControlsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  })
  const primaryButtonScale = primaryPressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  })
  const primaryButtonLabel = mode === 'stopwatch'
    ? stopwatchRunning
      ? 'PAUSE'
      : 'START'
    : timerRunning
      ? 'PAUSE'
      : 'START'
  const animatePrimaryPress = (pressed: boolean) => {
    Animated.timing(primaryPressProgress, {
      toValue: pressed ? 1 : 0,
      duration: pressed ? 80 : 130,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <WeatherAtmosphere paletteKey={weatherThemeKey} />
      <Pressable
        accessible={false}
        delayLongPress={650}
        onLongPress={cycleWeatherTheme}
        style={styles.themeCycleSurface}
      />
      <TYStack
        flex={1}
        paddingHorizontal={contentPadding}
        paddingTop={topPadding}
        style={{ pointerEvents: 'box-none' }}
        zIndex={2}
      >
          <TYStack style={{ pointerEvents: 'box-none' }} zIndex={1}>
            <View
              style={{
                alignSelf: 'center',
                backgroundColor: palette.tabTrack,
                borderRadius: FULL_RADIUS,
                flexDirection: 'row',
                gap: TAB_BUTTON_GAP,
                padding: TAB_TRACK_PADDING,
                pointerEvents: 'box-none',
                position: 'relative',
              }}
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  left: TAB_TRACK_PADDING,
                  top: TAB_TRACK_PADDING,
                  width: TAB_BUTTON_SIZE,
                  height: TAB_BUTTON_HEIGHT,
                  borderRadius: FULL_RADIUS,
                  backgroundColor: palette.activeTab,
                  pointerEvents: 'none',
                  transform: [{ translateX: activeTabTranslateX }],
                }}
              />
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'stopwatch' }}
                accessibilityLabel="Stopwatch"
                onPress={() => setMode('stopwatch')}
                style={{
                  width: TAB_BUTTON_SIZE,
                  height: TAB_BUTTON_HEIGHT,
                  borderRadius: FULL_RADIUS,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Timer
                  color={mode === 'stopwatch' ? palette.activeTabText : palette.muted}
                  size={TAB_ICON_SIZE}
                  strokeWidth={2.25}
                />
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'timer' }}
                accessibilityLabel="Timer"
                onPress={() => setMode('timer')}
                style={{
                  width: TAB_BUTTON_SIZE,
                  height: TAB_BUTTON_HEIGHT,
                  borderRadius: FULL_RADIUS,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Hourglass
                  color={mode === 'timer' ? palette.activeTabText : palette.muted}
                  size={TAB_ICON_SIZE}
                  strokeWidth={2.25}
                />
              </Pressable>
            </View>
        </TYStack>

        <TYStack
          position="absolute"
          top={numberBlockTop}
          left={contentPadding}
          right={contentPadding}
          alignItems="center"
          style={{ pointerEvents: 'box-none' }}
        >
          <TYStack width="100%" alignItems="center" gap={displayGap} style={{ pointerEvents: 'box-none' }}>
            <View style={{ pointerEvents: 'none' }}>
              <RollingClockDisplay
                value={display}
                color={palette.text}
                direction={clockMotionDirection}
                fontSize={numberFontSize}
                lineHeight={numberLineHeight}
              />
            </View>

            <TYStack width="100%" gap={controlGap} style={{ pointerEvents: 'box-none' }}>
              <TXStack gap={controlGap} alignSelf="center" style={{ pointerEvents: 'box-none' }}>
                <Animated.View
                  style={{
                    opacity: timerSideControlOpacity,
                    pointerEvents: mode === 'timer' ? 'auto' : 'none',
                    transform: [
                      { translateX: decreaseControlTranslateX },
                      { scale: timerSideControlScale },
                    ],
                  }}
                >
                  <TButton
                    width={activeControlButtonSize}
                    height={activeControlButtonSize}
                    borderRadius={FULL_RADIUS}
                    backgroundColor={palette.control}
                    disabled={mode !== 'timer' || timerRunning}
                    aria-label="Decrease timer by one minute. Hold to decrease by ten minutes repeatedly."
                    onPressIn={() => startTimerHoldRepeat(-1)}
                    onPressOut={stopTimerHoldRepeat}
                    onPress={() => handleTimerStepPress(-1)}
                  >
                    <CircleMinus
                      color={timerRunning ? palette.controlMuted : palette.text}
                      size={activeControlIconSize}
                      strokeWidth={2.25}
                    />
                  </TButton>
                </Animated.View>
                <TButton
                  width={activeControlButtonSize}
                  height={activeControlButtonSize}
                  borderRadius={FULL_RADIUS}
                  backgroundColor={palette.control}
                  color={palette.text}
                  aria-label="Reset"
                  onPress={resetCurrentMode}
                >
                  <RotateCw
                    color={palette.text}
                    size={activeControlIconSize}
                    strokeWidth={2.25}
                  />
                </TButton>
                <Animated.View
                  style={{
                    opacity: timerSideControlOpacity,
                    pointerEvents: mode === 'timer' ? 'auto' : 'none',
                    transform: [
                      { translateX: increaseControlTranslateX },
                      { scale: timerSideControlScale },
                    ],
                  }}
                >
                  <TButton
                    width={activeControlButtonSize}
                    height={activeControlButtonSize}
                    borderRadius={FULL_RADIUS}
                    backgroundColor={palette.control}
                    disabled={mode !== 'timer' || timerRunning}
                    aria-label="Increase timer by one minute. Hold to increase by ten minutes repeatedly."
                    onPressIn={() => startTimerHoldRepeat(1)}
                    onPressOut={stopTimerHoldRepeat}
                    onPress={() => handleTimerStepPress(1)}
                  >
                    <CirclePlus
                      color={timerRunning ? palette.controlMuted : palette.text}
                      size={activeControlIconSize}
                      strokeWidth={2.25}
                    />
                  </TButton>
                </Animated.View>
              </TXStack>
              <Animated.View
                style={{
                  width: primaryButtonWidth,
                  maxWidth: '100%',
                  alignSelf: 'center',
                  transform: [{ scale: primaryButtonScale }],
                }}
              >
                <TButton
                  width="100%"
                  size="$6"
                  height={primaryButtonHeight}
                  borderRadius={FULL_RADIUS}
                  backgroundColor={palette.primary}
                  pressStyle={{ backgroundColor: palette.primary }}
                  onPressIn={() => animatePrimaryPress(true)}
                  onPressOut={() => animatePrimaryPress(false)}
                  onPress={() => {
                    if (mode === 'stopwatch') {
                      setStopwatchRunning((running) => !running)
                      return
                    }

                    if (timerSeconds > 0) {
                      setTimerRunning((running) => {
                        if (!running) {
                          timerFinishAlerted.current = false
                        }

                        return !running
                      })
                    }
                  }}
                >
                  <PrimaryButtonLabel
                    label={primaryButtonLabel}
                    color={palette.primaryText}
                  />
                </TButton>
              </Animated.View>
            </TYStack>
          </TYStack>
        </TYStack>

        <TYStack flex={1} style={{ pointerEvents: 'none' }} />
        <TYStack height={reservedBottomSpace} style={{ pointerEvents: 'none' }} />
      </TYStack>
      <CharacterScene
        sceneHeight={sceneHeight}
        screenWidth={width}
        sizeScale={sceneScale}
      />
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Weather data by Open-Meteo"
        onPress={() => void Linking.openURL('https://open-meteo.com/')}
        style={styles.weatherCredit}
      >
        <Text style={{ color: palette.muted, fontSize: 10 }}>
          Weather by Open-Meteo
        </Text>
      </Pressable>
      <StatusBar style={statusBarStyle} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  themeCycleSurface: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  weatherCredit: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    opacity: 0.72,
    zIndex: 3,
  },
})

export default function App() {
  const [fontsLoaded] = useFonts({
    IBMPlexMono_400Regular,
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <ClockApp />
    </TamaguiProvider>
  )
}

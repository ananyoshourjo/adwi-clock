import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Text, View } from 'react-native'

const CLOCK_ROLL_DURATION = 250
const PRIMARY_LABEL_DURATION = 120
const CLOCK_CHARACTER_WIDTH_RATIO = 0.84

export type ClockMotionDirection = 1 | -1

function RollingClockCharacter({
  character,
  color,
  direction,
  fontSize,
  lineHeight,
}: {
  character: string
  color: string
  direction: ClockMotionDirection
  fontSize: number
  lineHeight: number
}) {
  const [visibleCharacter, setVisibleCharacter] = useState(character)
  const [previousCharacter, setPreviousCharacter] = useState<string | null>(null)
  const progress = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (character === visibleCharacter) {
      return
    }

    progress.stopAnimation()
    setPreviousCharacter(visibleCharacter)
    setVisibleCharacter(character)
    progress.setValue(0)

    Animated.timing(progress, {
      toValue: 1,
      duration: CLOCK_ROLL_DURATION,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setPreviousCharacter(null)
      }
    })
  }, [character, direction, progress, visibleCharacter])

  const travelDistance = lineHeight
  const incomingTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [direction * travelDistance, 0],
  })
  const outgoingTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -direction * travelDistance],
  })
  const outgoingOpacity = progress.interpolate({
    inputRange: [0, 0.92, 1],
    outputRange: [1, 1, 0],
  })
  const incomingOpacity = progress.interpolate({
    inputRange: [0, 0.08, 1],
    outputRange: [0, 1, 1],
  })

  return (
    <View
      style={{
        width: fontSize * CLOCK_CHARACTER_WIDTH_RATIO,
        height: lineHeight,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {previousCharacter === null ? null : (
        <Animated.Text
          style={[
            {
              position: 'absolute',
              color,
              fontFamily: 'IBMPlexMono_400Regular',
              fontSize,
              includeFontPadding: false,
              lineHeight,
              letterSpacing: 0,
              opacity: outgoingOpacity,
              textAlign: 'center',
              textAlignVertical: 'center',
              transform: [{ translateY: outgoingTranslateY }],
            },
          ]}
          allowFontScaling={false}
        >
          {previousCharacter}
        </Animated.Text>
      )}
      <Animated.Text
        style={[
          {
            color,
            fontFamily: 'IBMPlexMono_400Regular',
            fontSize,
            includeFontPadding: false,
            lineHeight,
            letterSpacing: 0,
            opacity: incomingOpacity,
            textAlign: 'center',
            textAlignVertical: 'center',
            transform: [{ translateY: incomingTranslateY }],
          },
        ]}
        allowFontScaling={false}
      >
        {visibleCharacter}
      </Animated.Text>
    </View>
  )
}

export function RollingClockDisplay({
  value,
  color,
  direction,
  fontSize,
  lineHeight,
}: {
  value: string
  color: string
  direction: ClockMotionDirection
  fontSize: number
  lineHeight: number
}) {
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {value.split('').map((character, index) => {
        const key = `${index}-${character === ':' ? 'separator' : 'digit'}`

        if (character === ':') {
          return (
            <Text
              key={key}
              style={{
                width: fontSize * CLOCK_CHARACTER_WIDTH_RATIO,
                color,
                fontFamily: 'IBMPlexMono_400Regular',
                fontSize,
                includeFontPadding: false,
                lineHeight,
                letterSpacing: 0,
                textAlign: 'center',
                textAlignVertical: 'center',
              }}
              allowFontScaling={false}
            >
              {character}
            </Text>
          )
        }

        return (
          <RollingClockCharacter
            key={key}
            character={character}
            color={color}
            direction={direction}
            fontSize={fontSize}
            lineHeight={lineHeight}
          />
        )
      })}
    </View>
  )
}

export function PrimaryButtonLabel({
  label,
  color,
}: {
  label: string
  color: string
}) {
  const [visibleLabel, setVisibleLabel] = useState(label)
  const [previousLabel, setPreviousLabel] = useState<string | null>(null)
  const progress = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (label === visibleLabel) {
      return
    }

    progress.stopAnimation()
    setPreviousLabel(visibleLabel)
    setVisibleLabel(label)
    progress.setValue(0)

    Animated.timing(progress, {
      toValue: 1,
      duration: PRIMARY_LABEL_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setPreviousLabel(null)
      }
    })
  }, [label, progress, visibleLabel])

  const outgoingOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  })
  const incomingOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  const textStyle = {
    color,
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 20,
    includeFontPadding: false,
    letterSpacing: 0.6,
    textAlign: 'center' as const,
    textAlignVertical: 'center' as const,
  }

  return (
    <View style={{ minHeight: 24, justifyContent: 'center' }}>
      {previousLabel === null ? null : (
        <Animated.Text
          style={[
            textStyle,
            {
              position: 'absolute',
              left: 0,
              right: 0,
              opacity: outgoingOpacity,
            },
          ]}
          allowFontScaling={false}
        >
          {previousLabel}
        </Animated.Text>
      )}
      <Animated.Text
        allowFontScaling={false}
        style={[textStyle, { opacity: incomingOpacity }]}
      >
        {visibleLabel}
      </Animated.Text>
    </View>
  )
}

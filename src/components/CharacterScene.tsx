import { useEffect, useRef, useState } from 'react'
import { Image, View } from 'react-native'

type BoyFrame = 'base' | 'blink' | 'click' | 'lookAcross' | 'lookAway' | 'success'
type GirlFrame = 'base' | 'blink' | 'pageFlip' | 'lookAcross' | 'blush' | 'smile'
type BubbleFrame = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

const AVATAR_WIDTH = 104
const AVATAR_HEIGHT = 165
const CHARACTER_SIDE_INSET = 18
const BUBBLE_WIDTH = 190
const BUBBLE_HEIGHT = 94
const BUBBLE_LEFT = 4
const BUBBLE_TOP = 0

const BOY_IMAGES: Record<BoyFrame, any> = {
  base: require('../../character-images/boy-base.png'),
  blink: require('../../character-images/boy-blink.png'),
  click: require('../../character-images/boy-click.png'),
  lookAcross: require('../../character-images/boy-look-across.png'),
  lookAway: require('../../character-images/boy-look-away.png'),
  success: require('../../character-images/boy-success.png'),
}

const GIRL_IMAGES: Record<GirlFrame, any> = {
  base: require('../../character-images/girl-base.png'),
  blink: require('../../character-images/girl-blink.png'),
  pageFlip: require('../../character-images/girl-page-flip.png'),
  lookAcross: require('../../character-images/girl-look-across.png'),
  blush: require('../../character-images/girl-blush.png'),
  smile: require('../../character-images/girl-smile.png'),
}

const BUBBLE_IMAGES: Record<BubbleFrame, any> = {
  0: require('../../character-images/1.png'),
  1: require('../../character-images/2.png'),
  2: require('../../character-images/3.png'),
  3: require('../../character-images/4.png'),
  4: require('../../character-images/5.png'),
  5: require('../../character-images/6.png'),
  6: require('../../character-images/7.png'),
  7: require('../../character-images/8.png'),
  8: require('../../character-images/9.png'),
  9: require('../../character-images/10.png'),
}

const BOY_FRAME_ORDER: BoyFrame[] = [
  'base',
  'blink',
  'click',
  'lookAcross',
  'lookAway',
  'success',
]
const GIRL_FRAME_ORDER: GirlFrame[] = [
  'base',
  'blink',
  'pageFlip',
  'lookAcross',
  'blush',
  'smile',
]
const BUBBLE_FRAME_ORDER: BubbleFrame[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function randomBetween(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

function weightedChoice<T>(items: { value: T; weight: number }[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let cursor = Math.random() * total

  for (const item of items) {
    cursor -= item.weight

    if (cursor <= 0) {
      return item.value
    }
  }

  return items[items.length - 1].value
}

function CharacterFrameStack<Frame extends string>({
  activeFrame,
  frames,
  images,
  side,
  sizeScale,
}: {
  activeFrame: Frame
  frames: Frame[]
  images: Record<Frame, any>
  side: 'left' | 'right'
  sizeScale: number
}) {
  const avatarWidth = Math.round(AVATAR_WIDTH * sizeScale)
  const avatarHeight = Math.round(AVATAR_HEIGHT * sizeScale)
  const sideInset = Math.round(CHARACTER_SIDE_INSET * sizeScale)

  return (
    <View
      style={{
        position: 'absolute',
        [side]: sideInset,
        bottom: 0,
        width: avatarWidth,
        height: avatarHeight,
      }}
    >
      {frames.map((frame) => (
        <Image
          key={frame}
          source={images[frame]}
          resizeMode="contain"
          fadeDuration={0}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: avatarWidth,
            height: avatarHeight,
            opacity: activeFrame === frame ? 1 : 0,
          }}
        />
      ))}
    </View>
  )
}
function BubbleFrameStack({
  activeFrame,
  sizeScale,
  visible,
}: {
  activeFrame: BubbleFrame
  sizeScale: number
  visible: boolean
}) {
  const bubbleWidth = Math.round(BUBBLE_WIDTH * sizeScale)
  const bubbleHeight = Math.round(BUBBLE_HEIGHT * sizeScale)

  return (
    <View
      style={{
        position: 'absolute',
        left: Math.round(BUBBLE_LEFT * sizeScale),
        top: Math.round(BUBBLE_TOP * sizeScale),
        width: bubbleWidth,
        height: bubbleHeight,
        opacity: visible ? 1 : 0,
      }}
    >
      {BUBBLE_FRAME_ORDER.map((frame) => (
        <Image
          key={frame}
          source={BUBBLE_IMAGES[frame]}
          resizeMode="contain"
          fadeDuration={0}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: bubbleWidth,
            height: bubbleHeight,
            opacity: activeFrame === frame ? 1 : 0,
          }}
        />
      ))}
    </View>
  )
}

export function CharacterScene({
  sceneHeight,
  screenWidth,
  sizeScale,
}: {
  sceneHeight: number
  screenWidth: number
  sizeScale: number
}) {
  const [boyFrame, setBoyFrame] = useState<BoyFrame>('base')
  const [girlFrame, setGirlFrame] = useState<GirlFrame>('base')
  const [bubbleFrame, setBubbleFrame] = useState<BubbleFrame>(0)
  const [showBubble, setShowBubble] = useState(false)
  const prioritySceneActive = useRef(false)
  const boyMotionToken = useRef(0)
  const girlMotionToken = useRef(0)
  const boyBusyUntil = useRef(0)
  const girlBusyUntil = useRef(0)

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []
    const intervals: ReturnType<typeof setInterval>[] = []

    const schedule = (callback: () => void, delay: number) => {
      const id = setTimeout(callback, delay)
      timeouts.push(id)
      return id
    }

    const boyIsAvailable = () =>
      !prioritySceneActive.current && Date.now() >= boyBusyUntil.current

    const girlIsAvailable = () =>
      !prioritySceneActive.current && Date.now() >= girlBusyUntil.current

    const playBoyFrame = (frame: BoyFrame, duration: number) => {
      const token = boyMotionToken.current + 1
      boyMotionToken.current = token
      boyBusyUntil.current = Date.now() + duration + 80
      setBoyFrame(frame)

      schedule(() => {
        if (!prioritySceneActive.current && boyMotionToken.current === token) {
          setBoyFrame('base')
        }
      }, duration)
    }

    const playGirlFrame = (frame: GirlFrame, duration: number) => {
      const token = girlMotionToken.current + 1
      girlMotionToken.current = token
      girlBusyUntil.current = Date.now() + duration + 80
      setGirlFrame(frame)

      schedule(() => {
        if (!prioritySceneActive.current && girlMotionToken.current === token) {
          setGirlFrame('base')
        }
      }, duration)
    }

    const scheduleBoyClick = () => {
      schedule(() => {
        if (boyIsAvailable()) {
          playBoyFrame('click', randomBetween(180, 280))
        }

        scheduleBoyClick()
      }, randomBetween(1800, 3600))
    }

    const scheduleBoyBlink = () => {
      schedule(() => {
        if (boyIsAvailable()) {
          playBoyFrame('blink', randomBetween(85, 125))
        }

        scheduleBoyBlink()
      }, randomBetween(5200, 9200))
    }

    const scheduleGirlBlink = () => {
      schedule(() => {
        if (girlIsAvailable()) {
          playGirlFrame('blink', randomBetween(90, 135))
        }

        scheduleGirlBlink()
      }, randomBetween(4800, 8800))
    }

    const scheduleGirlPageFlip = () => {
      schedule(() => {
        if (girlIsAvailable()) {
          playGirlFrame('pageFlip', randomBetween(520, 760))
        }

        scheduleGirlPageFlip()
      }, randomBetween(3800, 7200))
    }

    const scheduleBoyRare = () => {
      schedule(() => {
        if (boyIsAvailable()) {
          const nextFrame = weightedChoice<BoyFrame>([
            { value: 'lookAway', weight: 58 },
            { value: 'success', weight: 42 },
          ])

          playBoyFrame(nextFrame, randomBetween(900, 1500))
        }

        scheduleBoyRare()
      }, randomBetween(18000, 42000))
    }

    const scheduleGirlRare = () => {
      schedule(() => {
        if (girlIsAvailable()) {
          const nextFrame = weightedChoice<'smile' | 'lookAcross' | 'blushThenLook'>(
            [
              { value: 'smile', weight: 52 },
              { value: 'lookAcross', weight: 26 },
              { value: 'blushThenLook', weight: 22 },
            ]
          )

          if (nextFrame === 'blushThenLook') {
            const token = girlMotionToken.current + 1
            girlMotionToken.current = token
            girlBusyUntil.current = Date.now() + 2600
            setGirlFrame('blush')
            schedule(() => {
              if (!prioritySceneActive.current && girlMotionToken.current === token) {
                setGirlFrame('lookAcross')
              }
            }, randomBetween(700, 1000))
            schedule(() => {
              if (!prioritySceneActive.current && girlMotionToken.current === token) {
                setGirlFrame('base')
              }
            }, randomBetween(1900, 2600))
          } else {
            playGirlFrame(nextFrame, randomBetween(900, 1500))
          }
        }

        scheduleGirlRare()
      }, randomBetween(14000, 36000))
    }

    const showFlirtMoment = () => {
      prioritySceneActive.current = true
      boyMotionToken.current += 1
      girlMotionToken.current += 1
      boyBusyUntil.current = Date.now() + 7800
      girlBusyUntil.current = Date.now() + 7800
      setBubbleFrame(Math.floor(Math.random() * BUBBLE_FRAME_ORDER.length) as BubbleFrame)
      setShowBubble(true)
      setBoyFrame('lookAcross')
      setGirlFrame('base')

      schedule(() => setGirlFrame('blush'), randomBetween(650, 950))
      schedule(() => setGirlFrame('lookAcross'), randomBetween(1600, 2100))
      schedule(() => setGirlFrame('base'), randomBetween(3300, 3900))
      schedule(() => {
        boyMotionToken.current += 1
        girlMotionToken.current += 1
        setBoyFrame('base')
        setGirlFrame('base')
        setShowBubble(false)
        prioritySceneActive.current = false
      }, randomBetween(6500, 7600))
    }

    scheduleBoyClick()
    scheduleBoyBlink()
    scheduleGirlBlink()
    scheduleGirlPageFlip()
    scheduleBoyRare()
    scheduleGirlRare()

    intervals.push(setInterval(showFlirtMoment, 60000))

    return () => {
      timeouts.forEach(clearTimeout)
      intervals.forEach(clearInterval)
    }
  }, [])

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: screenWidth,
        height: sceneHeight,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <BubbleFrameStack
        activeFrame={bubbleFrame}
        sizeScale={sizeScale}
        visible={showBubble}
      />
      <CharacterFrameStack
        activeFrame={boyFrame}
        frames={BOY_FRAME_ORDER}
        images={BOY_IMAGES}
        side="left"
        sizeScale={sizeScale}
      />
      <CharacterFrameStack
        activeFrame={girlFrame}
        frames={GIRL_FRAME_ORDER}
        images={GIRL_IMAGES}
        side="right"
        sizeScale={sizeScale}
      />
    </View>
  )
}

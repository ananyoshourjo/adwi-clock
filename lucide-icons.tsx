import type { ReactNode } from 'react'
import Svg, { Circle, Line, Path } from 'react-native-svg'

type IconProps = {
  color: string
  size: number
  strokeWidth?: number
}

function BaseIcon({
  children,
  color,
  size,
  strokeWidth = 2,
}: IconProps & { children: ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  )
}

export function Timer(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <Line x1="10" x2="14" y1="2" y2="2" />
      <Line x1="12" x2="15" y1="14" y2="11" />
      <Circle cx="12" cy="14" r="8" />
    </BaseIcon>
  )
}

export function Hourglass(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <Path d="M5 22h14" />
      <Path d="M5 2h14" />
      <Path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <Path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </BaseIcon>
  )
}

export function RotateCw(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <Path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <Path d="M21 3v5h-5" />
    </BaseIcon>
  )
}

export function CirclePlus(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M8 12h8" />
      <Path d="M12 8v8" />
    </BaseIcon>
  )
}

export function CircleMinus(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M8 12h8" />
    </BaseIcon>
  )
}

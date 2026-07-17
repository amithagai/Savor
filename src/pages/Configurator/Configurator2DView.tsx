import { useMemo } from 'react'
import {
  buildCabinetLayout,
  COUNTERTOP_HEIGHT_CM,
  doorCount,
  isOven,
  type CabinetLayoutItem,
  type PlacedCabinet,
} from './cabinetLayout'
import { colorHexOf } from './colors'

type Props = {
  cartItems: CabinetLayoutItem[]
}

const MARGIN = 40
const GAP_HALF = 0.5

function CabinetShape({ placed }: { placed: PlacedCabinet }) {
  const { item, x, width, spec } = placed
  const { height, elevation } = spec
  const color = colorHexOf(item.colorId)
  const left = x - width / 2
  const doors = doorCount(item.subtitle)
  const lines: number[] = []
  for (let i = 1; i < doors; i++) lines.push(left + (width / doors) * i)

  return (
    <g>
      <rect
        x={left}
        y={-(elevation + height)}
        width={width}
        height={height}
        fill={color}
        stroke="#00000055"
        strokeWidth={0.6}
      />
      {lines.map((lx, i) => (
        <line key={i} x1={lx} x2={lx} y1={-(elevation + height) + 2} y2={-elevation - 2} stroke="#00000055" strokeWidth={0.5} />
      ))}
      {isOven(item.subtitle) && (
        <>
          <rect
            x={left + width * 0.09}
            y={-(elevation + height * 0.9)}
            width={width * 0.82}
            height={height * 0.5}
            fill="#1c1c1c"
          />
          <rect
            x={left + width * 0.14}
            y={-(elevation + height * 0.42)}
            width={width * 0.72}
            height={height * 0.025}
            fill="#4a4a4a"
          />
        </>
      )}
      <text x={x} y={-elevation + 8} textAnchor="middle" fontSize={7} fill="#6b6b6b">
        {Math.round(width)}
      </text>
    </g>
  )
}

export default function Configurator2DView({ cartItems }: Props) {
  const layout = useMemo(() => buildCabinetLayout(cartItems), [cartItems])
  const { floorRow, wallRow, counterSpan, floorSpan, wallSpan } = layout

  const contentWidth = Math.max(floorSpan, wallSpan, 100)
  const maxTop = Math.max(
    ...floorRow.map(p => p.spec.elevation + p.spec.height),
    ...wallRow.map(p => p.spec.elevation + p.spec.height),
    COUNTERTOP_HEIGHT_CM
  )
  const viewWidth = contentWidth + MARGIN * 2
  const viewHeight = maxTop + MARGIN * 2

  if (cartItems.length === 0) {
    return (
      <div className="cfg2d__empty">
        <p>לחצו על מוצר כדי להוסיף אותו לתצוגה</p>
      </div>
    )
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${-MARGIN} ${-(maxTop + MARGIN)} ${viewWidth} ${viewHeight}`}
      className="cfg2d__svg"
      preserveAspectRatio="xMidYMax meet"
    >
      <line x1={-MARGIN} x2={contentWidth + MARGIN} y1={0} y2={0} stroke="#c9c5bd" strokeWidth={1} />

      {counterSpan > 0 && (
        <rect
          x={-GAP_HALF}
          y={-(COUNTERTOP_HEIGHT_CM + 1.5)}
          width={counterSpan + GAP_HALF * 2}
          height={3}
          fill="#f5f3ef"
          stroke="#00000033"
          strokeWidth={0.5}
        />
      )}

      {floorRow.map(placed => (
        <CabinetShape key={placed.key} placed={placed} />
      ))}
      {wallRow.map(placed => (
        <CabinetShape key={placed.key} placed={placed} />
      ))}
    </svg>
  )
}

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  buildCabinetLayout,
  cabinetDragPositionUpdates,
  COUNTERTOP_HEIGHT_CM,
  DEFAULT_WALL_LENGTH_CM,
  doorCount,
  GAP_CM,
  HANDLE_TOP_OFFSET_CM,
  isOven,
  PLINTH_HEIGHT_CM,
  ROOM_DEPTH_CM,
  snapCabinetXToWall,
  WALL_HEIGHT_CM,
  type AccessoryPositions,
  type CabinetLayoutItem,
  type CabinetPositions,
  type CabinetSpatialPlacement,
  type CabinetSpatialPositions,
  type CabinetWall,
  type KitchenAccessoryId,
  type PlacedCabinet,
} from './cabinetLayout'
import { colorHexOf } from './colors'

type Props = {
  cartItems: CabinetLayoutItem[]
  wallLengthCm?: number | null
  positions: CabinetPositions
  onPositionChange: (key: string, xCm: number) => void
  spatialPositions: CabinetSpatialPositions
  onSpatialPositionChange: (key: string, placement: CabinetSpatialPlacement) => void
  accessories: AccessoryPositions
  onAccessoryPositionChange: (id: KitchenAccessoryId, xCm: number) => void
  showCountertop: boolean
}

const SIDE_MARGIN = 40
const TOP_MARGIN = 40
const DIMENSION_BOTTOM = 72
const GAP_HALF = 0.5
const SECTION_GAP = 34

const WALL_LABELS: Record<CabinetWall, string> = {
  left: 'קיר שמאלי',
  back: 'קיר אחורי',
  right: 'קיר ימני',
  free: 'מרכז החדר',
}

function formatDimension(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

type StartDrag = (event: ReactPointerEvent<SVGGElement>, type: 'cabinet' | 'accessory', key: string, x: number, width: number) => void

function CabinetShape({ placed, active, onStartDrag }: { placed: PlacedCabinet; active: boolean; onStartDrag: StartDrag }) {
  const { item, x, width, spec, key } = placed
  const { height, elevation } = spec
  const color = item.colorHex ?? colorHexOf(item.colorId)
  const left = x - width / 2
  const doors = doorCount(item.subtitle)
  const lines = Array.from({ length: Math.max(0, doors - 1) }, (_, index) => left + (width / doors) * (index + 1))

  return (
    <g
      className={`cfg2d__draggable${active ? ' cfg2d__draggable--active' : ''}`}
      onPointerDown={event => onStartDrag(event, 'cabinet', key, x, width)}
    >
      <rect
        x={left}
        y={-(elevation + height)}
        width={width}
        height={height}
        fill={color}
        stroke={active ? '#377e2b' : '#00000055'}
        strokeWidth={active ? 1.8 : 0.6}
      />
      {lines.map((lineX, index) => (
        <line key={index} x1={lineX} x2={lineX} y1={-(elevation + height) + 2} y2={-elevation - 2} stroke="#00000055" strokeWidth={0.5} />
      ))}
      {isOven(item.subtitle) ? (
        <>
          <rect x={left + width * 0.09} y={-(elevation + height * 0.9)} width={width * 0.82} height={height * 0.5} fill="#1c1c1c" />
          <rect x={left + width * 0.14} y={-(elevation + height * 0.42)} width={width * 0.72} height={height * 0.025} fill="#4a4a4a" />
        </>
      ) : (
        <rect x={x - Math.min(width * 0.55, 28) / 2} y={-(elevation + height) + HANDLE_TOP_OFFSET_CM} width={Math.min(width * 0.55, 28)} height={2} rx={1} fill="#454545" />
      )}
    </g>
  )
}

function ObjectDimension({ placed }: { placed: PlacedCabinet }) {
  const { x, width, spec } = placed
  const left = x - width / 2
  const right = x + width / 2
  const label = `${formatDimension(width)} × ${formatDimension(spec.height)}`

  if (spec.elevation > 0) {
    const labelY = -(spec.elevation + spec.height / 2)
    const labelWidth = Math.min(Math.max(34, label.length * 4.1), width - 6)
    return (
      <g className="cfg2d__dimension" pointerEvents="none">
        <rect x={x - labelWidth / 2} y={labelY - 7} width={labelWidth} height={13} rx={2.5} fill="#f8f6f0" fillOpacity={0.88} />
        <text x={x} y={labelY + 2} textAnchor="middle" fontSize={7} fill="#4e4a44" direction="ltr" unicodeBidi="isolate">{label}</text>
      </g>
    )
  }

  const lineY = 11
  return (
    <g className="cfg2d__dimension" pointerEvents="none">
      <line x1={left} x2={left} y1={0} y2={lineY + 3} stroke="#77736d" strokeWidth={0.45} />
      <line x1={right} x2={right} y1={0} y2={lineY + 3} stroke="#77736d" strokeWidth={0.45} />
      <line x1={left} x2={right} y1={lineY} y2={lineY} stroke="#77736d" strokeWidth={0.55} />
      <line x1={left - 2} x2={left + 2} y1={lineY + 3} y2={lineY - 3} stroke="#55514c" strokeWidth={0.7} />
      <line x1={right - 2} x2={right + 2} y1={lineY + 3} y2={lineY - 3} stroke="#55514c" strokeWidth={0.7} />
      <rect x={x - Math.min(21, width / 2 - 2)} y={lineY + 3} width={Math.min(42, width - 4)} height={12} rx={2.5} fill="#f8f6f0" fillOpacity={0.94} />
      <text x={x} y={lineY + 11.5} textAnchor="middle" fontSize={6.6} fill="#4e4a44" direction="ltr" unicodeBidi="isolate">{label}</text>
    </g>
  )
}

function OverallDimension({ start, end }: { start: number; end: number }) {
  const y = 48
  const middle = (start + end) / 2
  const label = `${formatDimension(end - start)} ס״מ`
  const labelWidth = Math.max(38, label.length * 4.4)

  return (
    <g className="cfg2d__dimension cfg2d__dimension--overall" pointerEvents="none">
      <line x1={start} x2={start} y1={0} y2={y + 5} stroke="#625e58" strokeWidth={0.55} />
      <line x1={end} x2={end} y1={0} y2={y + 5} stroke="#625e58" strokeWidth={0.55} />
      <line x1={start} x2={end} y1={y} y2={y} stroke="#4d4944" strokeWidth={0.85} />
      <line x1={start - 3} x2={start + 3} y1={y + 4} y2={y - 4} stroke="#3f3b37" strokeWidth={1} />
      <line x1={end - 3} x2={end + 3} y1={y + 4} y2={y - 4} stroke="#3f3b37" strokeWidth={1} />
      <rect x={middle - labelWidth / 2} y={y - 7} width={labelWidth} height={14} rx={3} fill="#f8f6f0" />
      <text x={middle} y={y + 3} textAnchor="middle" fontSize={8} fontWeight={600} fill="#37332f" direction="ltr" unicodeBidi="isolate">{label}</text>
    </g>
  )
}

function AccessoryShapes({ accessories, activeKey, onStartDrag }: {
  accessories: AccessoryPositions
  activeKey: string | null
  onStartDrag: StartDrag
}) {
  return (
    <>
      {accessories.sink != null && (
        <g
          className={`cfg2d__draggable${activeKey === 'accessory-sink' ? ' cfg2d__draggable--active' : ''}`}
          onPointerDown={event => onStartDrag(event, 'accessory', 'sink', accessories.sink!, 52)}
        >
          <rect x={accessories.sink - 26} y={-(COUNTERTOP_HEIGHT_CM + 6)} width={52} height={8} rx={3} fill="#aeb3b4" stroke="#555d60" strokeWidth={0.8} />
          <rect x={accessories.sink - 21} y={-(COUNTERTOP_HEIGHT_CM + 5)} width={42} height={5} rx={2} fill="#596164" />
        </g>
      )}
      {accessories.faucet != null && (
        <g
          className={`cfg2d__draggable${activeKey === 'accessory-faucet' ? ' cfg2d__draggable--active' : ''}`}
          onPointerDown={event => onStartDrag(event, 'accessory', 'faucet', accessories.faucet!, 8)}
          fill="none"
          stroke={activeKey === 'accessory-faucet' ? '#377e2b' : '#6d7476'}
          strokeWidth={3}
          strokeLinecap="round"
        >
          <path d={`M ${accessories.faucet} ${-COUNTERTOP_HEIGHT_CM} V ${-(COUNTERTOP_HEIGHT_CM + 28)} Q ${accessories.faucet} ${-(COUNTERTOP_HEIGHT_CM + 36)} ${accessories.faucet + 9} ${-(COUNTERTOP_HEIGHT_CM + 36)} H ${accessories.faucet + 16} V ${-(COUNTERTOP_HEIGHT_CM + 29)}`} />
        </g>
      )}
    </>
  )
}

type DragState = { type: 'cabinet' | 'accessory'; key: string; width: number; offset: number }

type WallSection = {
  wall: CabinetWall
  wallWidth: number
  designWidth: number
  offsetX: number
  floorRow: PlacedCabinet[]
  wallRow: PlacedCabinet[]
  counterRuns: { start: number; end: number }[]
}

type WallDragState = DragState & { wall: CabinetWall; sectionOffsetX: number; wallWidth: number }

function counterRunsForRow(row: PlacedCabinet[]) {
  const extents = row
    .filter(placed => placed.item.category !== 'גבוהים')
    .map(placed => ({ start: placed.x - placed.width / 2, end: placed.x + placed.width / 2 }))
    .sort((first, second) => first.start - second.start)

  return extents.reduce<Array<{ start: number; end: number }>>((runs, extent) => {
    const last = runs[runs.length - 1]
    if (!last || extent.start > last.end + GAP_CM * 2) runs.push({ ...extent })
    else last.end = Math.max(last.end, extent.end)
    return runs
  }, [])
}

function positionOnWall(placed: PlacedCabinet, spatialPositions: CabinetSpatialPositions) {
  const placement = spatialPositions[placed.key]
  if (!placement) return { wall: 'back' as const, x: placed.x }
  return {
    wall: placement.wall,
    x: placement.wall === 'left' || placement.wall === 'right' ? placement.zCm : placement.xCm,
  }
}

export default function Configurator2DView({
  cartItems,
  wallLengthCm,
  positions,
  onPositionChange,
  spatialPositions,
  onSpatialPositionChange,
  accessories,
  onAccessoryPositionChange,
  showCountertop,
}: Props) {
  const layout = useMemo(() => buildCabinetLayout(cartItems, positions), [cartItems, positions])
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<WallDragState | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const wallWidth = wallLengthCm ?? Math.max(layout.floorEnd, layout.wallEnd, DEFAULT_WALL_LENGTH_CM)
  const designWidth = Math.max(wallWidth, layout.floorEnd, layout.wallEnd, DEFAULT_WALL_LENGTH_CM)
  const sections = useMemo<WallSection[]>(() => {
    const floorKeys = new Set(layout.floorRow.map(placed => placed.key))
    const grouped = new Map<CabinetWall, PlacedCabinet[]>([
      ['left', []],
      ['back', []],
      ['right', []],
      ['free', []],
    ])

    const allCabinets = [...layout.floorRow, ...layout.wallRow]
    allCabinets.forEach(placed => {
      const projected = positionOnWall(placed, spatialPositions)
      grouped.get(projected.wall)!.push({ ...placed, x: projected.x })
    })

    const allWalls: CabinetWall[] = ['left', 'back', 'right', 'free']
    const visibleWalls = allWalls.filter(wall => (
      wall === 'back' || grouped.get(wall)!.length > 0
    ))
    let cursor = 0

    return visibleWalls.map(wall => {
      const cabinets = grouped.get(wall)!
      const sectionWallWidth = wall === 'left' || wall === 'right' ? ROOM_DEPTH_CM : wallWidth
      const cabinetEnd = cabinets.length > 0
        ? Math.max(...cabinets.map(placed => placed.x + placed.width / 2))
        : 0
      const sectionDesignWidth = Math.max(sectionWallWidth, cabinetEnd)
      const floorRow = cabinets.filter(placed => floorKeys.has(placed.key))
      const wallRow = cabinets.filter(placed => !floorKeys.has(placed.key))
      const section: WallSection = {
        wall,
        wallWidth: sectionWallWidth,
        designWidth: sectionDesignWidth,
        offsetX: cursor,
        floorRow,
        wallRow,
        counterRuns: counterRunsForRow(floorRow),
      }
      cursor += sectionDesignWidth + SECTION_GAP
      return section
    })
  }, [layout, spatialPositions, wallWidth])
  const backCounterRuns = sections.find(section => section.wall === 'back')?.counterRuns ?? []
  const maxTop = Math.max(
    WALL_HEIGHT_CM,
    ...layout.floorRow.map(placed => placed.spec.elevation + placed.spec.height),
    ...layout.wallRow.map(placed => placed.spec.elevation + placed.spec.height),
    COUNTERTOP_HEIGHT_CM + 40
  )
  const sectionsWidth = sections.reduce((sum, section) => sum + section.designWidth, 0)
    + Math.max(0, sections.length - 1) * SECTION_GAP
  const viewWidth = Math.max(designWidth, sectionsWidth) + SIDE_MARGIN * 2
  const viewHeight = maxTop + TOP_MARGIN + DIMENSION_BOTTOM

  function svgX(clientX: number) {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return 0
    const point = svg.createSVGPoint()
    point.x = clientX
    return point.matrixTransform(matrix.inverse()).x
  }

  function startDrag(
    event: ReactPointerEvent<SVGGElement>,
    type: DragState['type'],
    key: string,
    x: number,
    width: number,
    section: WallSection,
  ) {
    event.stopPropagation()
    dragRef.current = {
      type,
      key,
      width,
      wall: section.wall,
      wallWidth: section.wallWidth,
      sectionOffsetX: section.offsetX,
      offset: x + section.offsetX - svgX(event.clientX),
    }
    setActiveKey(`${type}-${key}`)
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  function clampAccessoryX(x: number, width: number) {
    if (backCounterRuns.length === 0) return x
    const half = width / 2
    return backCounterRuns
      .map(run => {
        const min = run.start + half
        const max = run.end - half
        const candidate = min <= max ? Math.min(Math.max(x, min), max) : (run.start + run.end) / 2
        return { candidate, distance: Math.abs(candidate - x) }
      })
      .sort((a, b) => a.distance - b.distance)[0].candidate
  }

  function moveDrag(event: ReactPointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    if (!drag) return
    const rawX = svgX(event.clientX) + drag.offset - drag.sectionOffsetX
    if (drag.type === 'cabinet') {
      const section = sections.find(candidate => candidate.wall === drag.wall)
      if (!section) return
      const updates = cabinetDragPositionUpdates(
        [...section.floorRow, ...section.wallRow],
        drag.key,
        snapCabinetXToWall(rawX, drag.width, drag.wallWidth),
        drag.wallWidth,
      )
      Object.entries(updates).forEach(([key, x]) => {
        const roundedX = Math.round(x)
        if (drag.wall === 'back') {
          onPositionChange(key, roundedX)
          return
        }

        const existing = spatialPositions[key]
        if (drag.wall === 'left') {
          onSpatialPositionChange(key, { xCm: 0, zCm: roundedX, wall: 'left' })
        } else if (drag.wall === 'right') {
          onSpatialPositionChange(key, { xCm: wallWidth, zCm: roundedX, wall: 'right' })
        } else {
          onSpatialPositionChange(key, {
            xCm: roundedX,
            zCm: existing?.zCm ?? 0,
            wall: 'free',
          })
        }
      })
    } else {
      onAccessoryPositionChange(drag.key as KitchenAccessoryId, Math.round(clampAccessoryX(rawX, drag.width)))
    }
  }

  function endDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (!dragRef.current) return
    if (svgRef.current?.hasPointerCapture(event.pointerId)) svgRef.current.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setActiveKey(null)
  }

  if (cartItems.length === 0) {
    return <div className="cfg2d__empty"><p>לחצו על מוצר כדי להוסיף אותו לתצוגה</p></div>
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`${-SIDE_MARGIN} ${-(maxTop + TOP_MARGIN)} ${viewWidth} ${viewHeight}`}
      className="cfg2d__svg"
      preserveAspectRatio="xMidYMax meet"
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {sections.map(section => {
        const allCabinets = [...section.floorRow, ...section.wallRow]
        const overallStart = allCabinets.length > 0
          ? Math.min(...allCabinets.map(placed => placed.x - placed.width / 2))
          : 0
        const overallEnd = allCabinets.length > 0
          ? Math.max(...allCabinets.map(placed => placed.x + placed.width / 2))
          : 0
        const sectionStartDrag: StartDrag = (event, type, key, x, width) => (
          startDrag(event, type, key, x, width, section)
        )

        return (
          <g key={section.wall} transform={`translate(${section.offsetX} 0)`}>
            <rect
              x={0}
              y={-WALL_HEIGHT_CM}
              width={section.wallWidth}
              height={WALL_HEIGHT_CM}
              fill={section.wall === 'free' ? '#e4e1da' : '#cec7bd'}
              stroke="#8e887f"
              strokeWidth={0.8}
            />
            <line x1={-8} x2={section.designWidth + 8} y1={0} y2={0} stroke="#aaa49a" strokeWidth={1} />
            <g className="cfg2d__wall-label" pointerEvents="none">
              <rect x={section.wallWidth / 2 - 39} y={-WALL_HEIGHT_CM - 28} width={78} height={19} rx={9.5} />
              <text x={section.wallWidth / 2} y={-WALL_HEIGHT_CM - 15} textAnchor="middle">
                {`${WALL_LABELS[section.wall]} · ${allCabinets.length}`}
              </text>
            </g>

            {showCountertop && section.counterRuns.map((run, index) => (
              <rect
                key={`countertop-${index}`}
                x={run.start - GAP_HALF}
                y={-(COUNTERTOP_HEIGHT_CM + 1.5)}
                width={run.end - run.start + GAP_HALF * 2}
                height={3}
                fill="#d8d1c6"
                stroke="#00000055"
                strokeWidth={0.5}
              />
            ))}

            {section.floorRow.map(placed => (
              <CabinetShape key={placed.key} placed={placed} active={activeKey === `cabinet-${placed.key}`} onStartDrag={sectionStartDrag} />
            ))}
            {section.wallRow.map(placed => (
              <CabinetShape key={placed.key} placed={placed} active={activeKey === `cabinet-${placed.key}`} onStartDrag={sectionStartDrag} />
            ))}
            {section.counterRuns.map((run, index) => (
              <rect
                key={`plinth-${index}`}
                x={run.start}
                y={-PLINTH_HEIGHT_CM}
                width={run.end - run.start}
                height={PLINTH_HEIGHT_CM}
                fill="#b9b0a4"
                stroke="#8f867b"
                strokeWidth={0.45}
                pointerEvents="none"
              />
            ))}
            {section.wall === 'back' && (
              <AccessoryShapes accessories={accessories} activeKey={activeKey} onStartDrag={sectionStartDrag} />
            )}
            {allCabinets.map(placed => <ObjectDimension key={`dimension-${placed.key}`} placed={placed} />)}
            {allCabinets.length > 0 && <OverallDimension start={overallStart} end={overallEnd} />}
          </g>
        )
      })}
    </svg>
  )
}

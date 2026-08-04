export type CabinetCategory = 'תחתונים' | 'כיור' | 'גבוהים' | 'עליונים'

export type CabinetLayoutItem = {
  id: string
  qty: number
  width: number
  category: CabinetCategory
  subtitle: string
  colorId: string
  modelSlug?: string
}

export type CabinetPositions = Record<string, number>
export type KitchenAccessoryId = 'sink' | 'faucet'
export type AccessoryPositions = Partial<Record<KitchenAccessoryId, number>>

export type CategorySpec = { height: number; depth: number; elevation: number }

// Matches the real per-SKU models' measured dimensions (legs + overhang add
// a few cm on top of the spec sheet's nominal carcass sizes), in centimeters.
export const CATEGORY_SPEC: Record<CabinetCategory, CategorySpec> = {
  'תחתונים': { height: 87.5, depth: 64, elevation: 0 },
  'כיור': { height: 87.5, depth: 64, elevation: 0 },
  'גבוהים': { height: 225, depth: 64, elevation: 0 },
  'עליונים': { height: 78, depth: 32, elevation: 150 },
}

export const GAP_CM = 1
export const COUNTERTOP_HEIGHT_CM = CATEGORY_SPEC['תחתונים'].height
export const COUNTERTOP_DEPTH_CM = CATEGORY_SPEC['תחתונים'].depth
export const PLINTH_HEIGHT_CM = 10
export const PLINTH_RECESS_CM = 7
export const HANDLE_TOP_OFFSET_CM = 7

export function doorCount(subtitle: string): number {
  const match = subtitle.match(/(\d+)\s*דלתות/)
  if (match) return Number(match[1])
  if (subtitle.includes('דלת')) return 1
  return 0
}

export function isOven(subtitle: string): boolean {
  return subtitle.includes('תנור')
}

export type PlacedCabinet = {
  item: CabinetLayoutItem
  x: number
  width: number
  spec: CategorySpec
  key: string
}

function verticallyOverlaps(first: PlacedCabinet, second: PlacedCabinet) {
  const firstBottom = first.spec.elevation
  const firstTop = firstBottom + first.spec.height
  const secondBottom = second.spec.elevation
  const secondTop = secondBottom + second.spec.height
  return firstBottom < secondTop && secondBottom < firstTop
}

/**
 * Returns the free horizontal position closest to the pointer. Cabinets may
 * share the same X only when their vertical ranges do not meet (for example,
 * a wall cabinet above a base cabinet). Tall, floor and peer wall cabinets
 * are treated as solid obstacles with the configured installation gap.
 */
export function closestAvailableCabinetX(
  cabinets: PlacedCabinet[],
  movingKey: string,
  proposedX: number,
  designWidth: number,
) {
  const moving = cabinets.find(cabinet => cabinet.key === movingKey)
  if (!moving) return proposedX

  const half = moving.width / 2
  const minX = half
  const maxX = Math.max(half, designWidth - half)
  const clamp = (value: number) => Math.min(Math.max(value, minX), maxX)
  const obstacles = cabinets.filter(cabinet => cabinet.key !== movingKey && verticallyOverlaps(moving, cabinet))
  const isFree = (candidate: number) => obstacles.every(obstacle => (
    Math.abs(candidate - obstacle.x) + 0.001 >= (moving.width + obstacle.width) / 2 + GAP_CM
  ))

  const candidates = [clamp(proposedX), clamp(moving.x), minX, maxX]
  obstacles.forEach(obstacle => {
    const clearance = (moving.width + obstacle.width) / 2 + GAP_CM
    candidates.push(clamp(obstacle.x - clearance), clamp(obstacle.x + clearance))
  })

  const available = candidates.filter(isFree)
  if (available.length === 0) return clamp(moving.x)
  return available.reduce((best, candidate) => (
    Math.abs(candidate - proposedX) < Math.abs(best - proposedX) ? candidate : best
  ))
}

/**
 * Calculates every position update required while a cabinet is dragged.
 *
 * A simple "nearest free spot" works while there is empty wall space, but it
 * cannot move a cabinet through a completely filled run. Once the pointer
 * crosses another cabinet's centre, reorder the horizontal row and repack it
 * with the installation gap. This gives the user a predictable sortable-row
 * interaction without ever rendering overlapping cabinets.
 */
export function cabinetDragPositionUpdates(
  cabinets: PlacedCabinet[],
  movingKey: string,
  proposedX: number,
  designWidth: number,
): CabinetPositions {
  const moving = cabinets.find(cabinet => cabinet.key === movingKey)
  if (!moving) return {}

  const row = cabinets
    .filter(cabinet => cabinet.spec.elevation === moving.spec.elevation)
    .sort((first, second) => first.x - second.x)
  const currentIndex = row.findIndex(cabinet => cabinet.key === movingKey)
  if (currentIndex < 0) return {}

  const rowWithoutMoving = row.filter(cabinet => cabinet.key !== movingKey)
  const insertionIndex = rowWithoutMoving.filter(cabinet => proposedX > cabinet.x).length

  if (insertionIndex === currentIndex) {
    const nextX = closestAvailableCabinetX(cabinets, movingKey, proposedX, designWidth)
    return Math.abs(nextX - moving.x) > 0.001 ? { [movingKey]: nextX } : {}
  }

  const reordered = [...rowWithoutMoving]
  reordered.splice(insertionIndex, 0, moving)
  const packedWidth = reordered.reduce((sum, cabinet) => sum + cabinet.width, 0)
    + Math.max(0, reordered.length - 1) * GAP_CM
  const currentStart = Math.min(...row.map(cabinet => cabinet.x - cabinet.width / 2))
  const maxStart = Math.max(0, designWidth - packedWidth)
  let cursor = Math.min(Math.max(currentStart, 0), maxStart)

  return reordered.reduce<CabinetPositions>((updates, cabinet) => {
    const nextX = cursor + cabinet.width / 2
    cursor += cabinet.width + GAP_CM
    if (Math.abs(nextX - cabinet.x) > 0.001) updates[cabinet.key] = nextX
    return updates
  }, {})
}

function removeOverlaps(cabinets: PlacedCabinet[]) {
  const roomyWidth = Math.max(
    150,
    ...cabinets.map(cabinet => cabinet.x + cabinet.width / 2),
  ) + cabinets.reduce((sum, cabinet) => sum + cabinet.width + GAP_CM, 0)

  return cabinets.reduce<PlacedCabinet[]>((placed, cabinet) => {
    const alongsidePlaced = [...placed, cabinet]
    const x = closestAvailableCabinetX(alongsidePlaced, cabinet.key, cabinet.x, roomyWidth)
    placed.push({ ...cabinet, x })
    return placed
  }, [])
}

const MODEL_SPEC: Partial<Record<string, Partial<CategorySpec>>> = {
  // The 100 cm flap cabinet is a 40 cm-high unit; the other upper cabinet
  // family is 78 cm high. Keep the real per-SKU proportions in both views.
  'klappa-100': { height: 40, depth: 32, elevation: 150 },
  'pantry-60-v2': { height: 225.3, depth: 61.7, elevation: 0 },
}

export function specForItem(item: CabinetLayoutItem): CategorySpec {
  return { ...CATEGORY_SPEC[item.category], ...(item.modelSlug ? MODEL_SPEC[item.modelSlug] : undefined) }
}

type CabinetInstance = { item: CabinetLayoutItem; key: string }

function expandItems(items: CabinetLayoutItem[]): CabinetInstance[] {
  return items.flatMap(item =>
    Array.from({ length: item.qty }, (_, occurrence) => ({
      item,
      key: `${item.id}-${item.colorId}-${occurrence}`,
    }))
  )
}

function layoutRow(instances: CabinetInstance[], positions: CabinetPositions, start = 0): PlacedCabinet[] {
  let cursor = start
  const placed: PlacedCabinet[] = []
  instances.forEach(({ item, key }) => {
    const spec = specForItem(item)
    const defaultX = cursor + item.width / 2
    placed.push({ item, x: positions[key] ?? defaultX, width: item.width, spec, key })
    cursor += item.width + GAP_CM
  })
  return placed
}

export type CounterRun = { start: number; end: number }

function counterRunsOf(row: PlacedCabinet[]): CounterRun[] {
  const extents = row
    .filter(placed => placed.item.category !== 'גבוהים')
    .map(placed => ({ start: placed.x - placed.width / 2, end: placed.x + placed.width / 2 }))
    .sort((a, b) => a.start - b.start)

  return extents.reduce<CounterRun[]>((runs, extent) => {
    const last = runs[runs.length - 1]
    if (!last || extent.start > last.end + GAP_CM * 2) {
      runs.push({ ...extent })
    } else {
      last.end = Math.max(last.end, extent.end)
    }
    return runs
  }, [])
}

function rowBounds(row: PlacedCabinet[]) {
  if (row.length === 0) return { start: 0, end: 0, span: 0 }
  const start = Math.min(...row.map(placed => placed.x - placed.width / 2))
  const end = Math.max(...row.map(placed => placed.x + placed.width / 2))
  return { start, end, span: end - start }
}

export type CabinetLayout = {
  floorRow: PlacedCabinet[]
  wallRow: PlacedCabinet[]
  counterRuns: CounterRun[]
  counterStart: number
  counterEnd: number
  counterSpan: number
  floorStart: number
  floorEnd: number
  floorSpan: number
  wallStart: number
  wallEnd: number
  wallSpan: number
}

// All measurements are in centimeters. Tall units go floor-to-ceiling, so
// they're placed after the counter run — wall cabinets are only ever
// positioned above the counter run, never above a tall unit.
export function buildCabinetLayout(cartItems: CabinetLayoutItem[], positions: CabinetPositions = {}): CabinetLayout {
  const floorItems = expandItems(cartItems.filter(item => item.category !== 'עליונים'))
  const wallItems = expandItems(cartItems.filter(item => item.category === 'עליונים'))

  const counterItems = floorItems.filter(({ item }) => item.category !== 'גבוהים')
  const tallItems = floorItems.filter(({ item }) => item.category === 'גבוהים')
  const orderedFloorItems = [...counterItems, ...tallItems]

  const preliminaryFloorRow = layoutRow(orderedFloorItems, positions)
  const preliminaryFloorBounds = rowBounds(preliminaryFloorRow)
  // Upper cabinets normally begin over the base run. If there is no base run,
  // place them beside tall cabinets by default so the initial layout is usable;
  // the customer can still drag either unit anywhere afterwards.
  const wallStart = counterItems.length === 0 && tallItems.length > 0
    ? preliminaryFloorBounds.end + GAP_CM
    : 0
  const preliminaryWallRow = layoutRow(wallItems, positions, wallStart)
  const floorKeys = new Set(preliminaryFloorRow.map(cabinet => cabinet.key))
  const withoutOverlaps = removeOverlaps([...preliminaryFloorRow, ...preliminaryWallRow])
  const floorRow = withoutOverlaps.filter(cabinet => floorKeys.has(cabinet.key))
  const wallRow = withoutOverlaps.filter(cabinet => !floorKeys.has(cabinet.key))
  const counterRuns = counterRunsOf(floorRow)
  const floorBounds = rowBounds(floorRow)
  const wallBounds = rowBounds(wallRow)
  const counterStart = counterRuns.length ? Math.min(...counterRuns.map(run => run.start)) : 0
  const counterEnd = counterRuns.length ? Math.max(...counterRuns.map(run => run.end)) : 0

  return {
    floorRow,
    wallRow,
    counterRuns,
    counterStart,
    counterEnd,
    counterSpan: Math.max(0, counterEnd - counterStart),
    floorStart: floorBounds.start,
    floorEnd: floorBounds.end,
    floorSpan: floorBounds.span,
    wallStart: wallBounds.start,
    wallEnd: wallBounds.end,
    wallSpan: wallBounds.span,
  }
}

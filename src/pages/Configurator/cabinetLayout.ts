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

function layoutRow(items: CabinetLayoutItem[]): PlacedCabinet[] {
  let cursor = 0
  const placed: PlacedCabinet[] = []
  items.forEach((item, i) => {
    const spec = CATEGORY_SPEC[item.category]
    placed.push({ item, x: cursor + item.width / 2, width: item.width, spec, key: `${item.id}-${i}` })
    cursor += item.width + GAP_CM
  })
  return placed
}

export type CabinetLayout = {
  floorRow: PlacedCabinet[]
  wallRow: PlacedCabinet[]
  counterSpan: number
  floorSpan: number
  wallSpan: number
}

// All measurements are in centimeters. Tall units go floor-to-ceiling, so
// they're placed after the counter run — wall cabinets are only ever
// positioned above the counter run, never above a tall unit.
export function buildCabinetLayout(cartItems: CabinetLayoutItem[]): CabinetLayout {
  const floorItems = cartItems.filter(item => item.category !== 'עליונים').flatMap(item => Array(item.qty).fill(item) as CabinetLayoutItem[])
  const wallItems = cartItems.filter(item => item.category === 'עליונים').flatMap(item => Array(item.qty).fill(item) as CabinetLayoutItem[])

  const counterItems = floorItems.filter(item => item.category !== 'גבוהים')
  const tallItems = floorItems.filter(item => item.category === 'גבוהים')
  const orderedFloorItems = [...counterItems, ...tallItems]

  const floorRow = layoutRow(orderedFloorItems)
  const wallRow = layoutRow(wallItems)

  const counterSpan = counterItems.length
    ? floorRow[counterItems.length - 1].x + floorRow[counterItems.length - 1].width / 2
    : 0
  const floorSpan = floorRow.length ? floorRow[floorRow.length - 1].x + floorRow[floorRow.length - 1].width / 2 : 0
  const wallSpan = wallRow.length ? wallRow[wallRow.length - 1].x + wallRow[wallRow.length - 1].width / 2 : 0

  return { floorRow, wallRow, counterSpan, floorSpan, wallSpan }
}

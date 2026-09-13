import {
  ROOM_DEPTH_CM,
  type AccessoryPositions,
  type CabinetSpatialPlacement,
  type CabinetSpatialPositions,
  type CabinetWall,
  type KitchenAccessoryId,
  type PlacedCabinet,
} from './cabinetLayout'

const POSITION_STEP_CM = 5

const WALL_OPTIONS: Array<{ value: CabinetWall; label: string }> = [
  { value: 'back', label: 'הקיר האחורי' },
  { value: 'left', label: 'הקיר השמאלי' },
  { value: 'right', label: 'הקיר הימני' },
  { value: 'free', label: 'מרכז החדר' },
]

type PositionAxisProps = {
  itemName: string
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

type KeyboardPositionControlsProps = {
  cabinets: PlacedCabinet[]
  wallLengthCm: number
  spatialPositions: CabinetSpatialPositions
  accessories: AccessoryPositions
  onCabinetPlacementChange: (cabinet: PlacedCabinet, placement: CabinetSpatialPlacement) => void
  onAccessoryPositionChange: (id: KitchenAccessoryId, xCm: number) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function cabinetInstanceName(cabinet: PlacedCabinet) {
  const occurrence = Number(cabinet.key.slice(cabinet.key.lastIndexOf('-') + 1)) + 1
  const productName = cabinet.item.name || cabinet.item.subtitle
  const color = cabinet.item.colorLabel ? `, צבע ${cabinet.item.colorLabel}` : ''
  return `${productName}${color}, עותק ${occurrence}`
}

function PositionAxis({ itemName, label, value, min, max, onChange }: PositionAxisProps) {
  const safeMax = Math.max(min, max)
  const safeValue = clamp(Math.round(value), min, safeMax)
  const move = (delta: number) => onChange(clamp(safeValue + delta, min, safeMax))

  return (
    <div className="cfg__position-axis">
      <span className="cfg__position-axis-label">{label}</span>
      <div className="cfg__position-axis-controls">
        <button
          type="button"
          className="cfg__position-step"
          onClick={() => move(-POSITION_STEP_CM)}
          disabled={safeValue <= min}
          aria-label={`הזזת ${itemName} ${POSITION_STEP_CM} סנטימטרים לכיוון תחילת הציר`}
        >
          −
        </button>
        <label className="cfg__position-range-wrap">
          <span className="visually-hidden">{label} עבור {itemName}</span>
          <input
            className="cfg__position-range"
            type="range"
            min={min}
            max={safeMax}
            step={POSITION_STEP_CM}
            value={safeValue}
            aria-valuetext={`${safeValue} סנטימטרים`}
            onChange={event => onChange(Number(event.target.value))}
          />
        </label>
        <output className="cfg__position-value" aria-hidden="true">{safeValue} ס״מ</output>
        <button
          type="button"
          className="cfg__position-step"
          onClick={() => move(POSITION_STEP_CM)}
          disabled={safeValue >= safeMax}
          aria-label={`הזזת ${itemName} ${POSITION_STEP_CM} סנטימטרים לכיוון סוף הציר`}
        >
          +
        </button>
      </div>
    </div>
  )
}

function placementForWall(
  cabinet: PlacedCabinet,
  current: CabinetSpatialPlacement,
  wall: CabinetWall,
  wallLengthCm: number,
): CabinetSpatialPlacement {
  const halfWidth = cabinet.width / 2
  const alongBack = clamp(current.wall === 'left' || current.wall === 'right' ? cabinet.x : current.xCm, halfWidth, Math.max(halfWidth, wallLengthCm - halfWidth))
  const alongSide = clamp(current.wall === 'left' || current.wall === 'right' ? current.zCm : halfWidth, halfWidth, Math.max(halfWidth, ROOM_DEPTH_CM - halfWidth))

  if (wall === 'back') return { xCm: alongBack, zCm: 0, wall }
  if (wall === 'left') return { xCm: 0, zCm: alongSide, wall }
  if (wall === 'right') return { xCm: wallLengthCm, zCm: alongSide, wall }
  return {
    xCm: current.wall === 'free' ? alongBack : wallLengthCm / 2,
    zCm: current.wall === 'free' ? current.zCm : ROOM_DEPTH_CM / 2,
    wall,
  }
}

export default function KeyboardPositionControls({
  cabinets,
  wallLengthCm,
  spatialPositions,
  accessories,
  onCabinetPlacementChange,
  onAccessoryPositionChange,
}: KeyboardPositionControlsProps) {
  const hasFaucet = accessories.faucet != null

  return (
    <details className="cfg__position-controls">
      <summary>מיקום פריטים באמצעות מקלדת</summary>
      <div className="cfg__position-controls-body">
        <p className="cfg__position-intro">
          בחרו קיר והשתמשו בכפתורים או בחיצי המקלדת כשהמחוון ממוקד. כל שינוי הוא בחמישה סנטימטרים.
        </p>

        {cabinets.length === 0 && !hasFaucet ? (
          <p className="cfg__position-empty">הוסיפו פריטים כדי להגדיר את מיקומם.</p>
        ) : (
          <ul className="cfg__position-list">
            {cabinets.map(cabinet => {
              const itemName = cabinetInstanceName(cabinet)
              const placement = spatialPositions[cabinet.key] ?? { xCm: cabinet.x, zCm: 0, wall: 'back' as const }
              const onAlongWallChange = (value: number) => onCabinetPlacementChange(cabinet, {
                ...placement,
                xCm: placement.wall === 'left' || placement.wall === 'right' ? placement.xCm : value,
                zCm: placement.wall === 'left' || placement.wall === 'right' ? value : placement.zCm,
              })
              const alongWallValue = placement.wall === 'left' || placement.wall === 'right'
                ? placement.zCm
                : placement.xCm
              const alongWallMax = (placement.wall === 'left' || placement.wall === 'right'
                ? ROOM_DEPTH_CM
                : wallLengthCm) - cabinet.width / 2

              return (
                <li key={cabinet.key} className="cfg__position-item">
                  <h4>{itemName}</h4>
                  <label className="cfg__position-wall-field">
                    <span>מיקום בחדר</span>
                    <select
                      value={placement.wall}
                      onChange={event => onCabinetPlacementChange(
                        cabinet,
                        placementForWall(cabinet, placement, event.target.value as CabinetWall, wallLengthCm),
                      )}
                    >
                      {WALL_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <PositionAxis
                    itemName={itemName}
                    label={placement.wall === 'free' ? 'מיקום לרוחב החדר' : 'מרחק מתחילת הקיר'}
                    value={alongWallValue}
                    min={cabinet.width / 2}
                    max={alongWallMax}
                    onChange={onAlongWallChange}
                  />
                  {placement.wall === 'free' && (
                    <PositionAxis
                      itemName={itemName}
                      label="מרחק מהקיר האחורי"
                      value={placement.zCm}
                      min={0}
                      max={ROOM_DEPTH_CM - cabinet.spec.depth}
                      onChange={value => onCabinetPlacementChange(cabinet, { ...placement, zCm: value })}
                    />
                  )}
                </li>
              )
            })}

            {hasFaucet && (
              <li className="cfg__position-item">
                <h4>ברז</h4>
                <PositionAxis
                  itemName="הברז"
                  label="מרחק מתחילת הקיר האחורי"
                  value={accessories.faucet!}
                  min={4}
                  max={Math.max(4, wallLengthCm - 4)}
                  onChange={value => onAccessoryPositionChange('faucet', value)}
                />
              </li>
            )}
          </ul>
        )}
      </div>
    </details>
  )
}

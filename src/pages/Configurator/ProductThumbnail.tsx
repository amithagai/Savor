import { colorHexOf } from './colors'

type Props = {
  modelSlug?: string
  productId: string
  colorId: string
  widthCm: number
}

type CabinetFace = {
  x: number
  y: number
  width: number
  height: number
}

function faceFor(modelSlug: string | undefined, widthCm: number): CabinetFace {
  if (modelSlug === 'pantry-60-v2') return { x: 22, y: 5, width: 31, height: 62 }
  if (modelSlug === 'klappa-100') return { x: 7, y: 22, width: 61, height: 29 }
  if (modelSlug === 'upper-60') return { x: 17, y: 11, width: 43, height: 49 }

  const width = widthCm <= 30 ? 29 : widthCm >= 80 ? 55 : 44
  return { x: (75 - width) / 2, y: 12, width, height: 52 }
}

function Handle({ x, y, width = 13 }: { x: number; y: number; width?: number }) {
  return (
    <rect
      x={x - width / 2}
      y={y}
      width={width}
      height={2.2}
      rx={1.1}
      fill="#464a48"
    />
  )
}

export default function ProductThumbnail({ modelSlug, productId, colorId, widthCm }: Props) {
  const face = faceFor(modelSlug, widthCm)
  const color = colorHexOf(colorId)
  const depth = 5
  const isUpper = modelSlug === 'klappa-100' || modelSlug === 'upper-60'
  const isTall = modelSlug === 'pantry-60-v2'
  const isOven = modelSlug === 'oven-60'
  const isShelfDrawer = modelSlug?.startsWith('shelf-drawer')
  const isThreeDrawers = modelSlug === 'three-drawers-60'
  const isTwoDoors = modelSlug === 'base-60-2door'
    || modelSlug === 'base-80-2door'
    || modelSlug === 'upper-60'
    || productId === 'p12'
    || productId === 'p13'
  const isFlap = modelSlug === 'klappa-100'

  return (
    <svg className="cfg__product-thumbnail" viewBox="0 0 80 76" aria-hidden="true">
      <ellipse
        cx={face.x + face.width / 2 + 2}
        cy={face.y + face.height + 5}
        rx={face.width * 0.52}
        ry={3.2}
        fill="rgba(45, 48, 46, 0.12)"
      />

      <path
        d={`M ${face.x} ${face.y} L ${face.x + depth} ${face.y - 4} H ${face.x + face.width + depth} L ${face.x + face.width} ${face.y} Z`}
        fill={color}
        stroke="rgba(43, 47, 44, 0.28)"
        strokeWidth="0.75"
      />
      <path
        d={`M ${face.x + face.width} ${face.y} L ${face.x + face.width + depth} ${face.y - 4} V ${face.y + face.height - 4} L ${face.x + face.width} ${face.y + face.height} Z`}
        fill={color}
        stroke="rgba(43, 47, 44, 0.32)"
        strokeWidth="0.75"
        style={{ filter: 'brightness(0.88)' }}
      />
      <rect
        x={face.x}
        y={face.y}
        width={face.width}
        height={face.height}
        rx={isUpper ? 1.2 : 0.8}
        fill={color}
        stroke="rgba(43, 47, 44, 0.4)"
        strokeWidth="0.9"
      />
      <rect
        x={face.x + 2.5}
        y={face.y + 2.5}
        width={face.width - 5}
        height={face.height - 5}
        rx="0.8"
        fill="none"
        stroke="rgba(255, 255, 255, 0.38)"
        strokeWidth="0.8"
      />

      {isOven && (
        <>
          <rect x={face.x + 4} y={face.y + 9} width={face.width - 8} height={face.height * 0.48} rx="1" fill="#242827" />
          <rect x={face.x + 6} y={face.y + 12} width={face.width - 12} height={face.height * 0.34} rx="0.8" fill="#111514" />
          <circle cx={face.x + 10} cy={face.y + 5.8} r="1.25" fill="#686d6a" />
          <circle cx={face.x + face.width - 10} cy={face.y + 5.8} r="1.25" fill="#686d6a" />
          <Handle x={face.x + face.width / 2} y={face.y + face.height * 0.58} width={face.width - 13} />
        </>
      )}

      {isShelfDrawer && (
        <>
          <line x1={face.x + 1} x2={face.x + face.width - 1} y1={face.y + 15} y2={face.y + 15} stroke="rgba(48, 52, 49, 0.38)" />
          <Handle x={face.x + face.width / 2} y={face.y + 7} width={Math.min(16, face.width - 8)} />
          <Handle x={face.x + face.width / 2} y={face.y + 21} width={Math.min(16, face.width - 8)} />
        </>
      )}

      {isThreeDrawers && [1, 2].map(index => (
        <line
          key={index}
          x1={face.x + 1}
          x2={face.x + face.width - 1}
          y1={face.y + (face.height / 3) * index}
          y2={face.y + (face.height / 3) * index}
          stroke="rgba(48, 52, 49, 0.4)"
        />
      ))}
      {isThreeDrawers && [1, 2, 3].map(index => (
        <Handle
          key={index}
          x={face.x + face.width / 2}
          y={face.y + (face.height / 3) * index - face.height / 6 - 1}
          width={Math.min(18, face.width - 9)}
        />
      ))}

      {isTwoDoors && (
        <>
          <line x1={face.x + face.width / 2} x2={face.x + face.width / 2} y1={face.y + 1} y2={face.y + face.height - 1} stroke="rgba(48, 52, 49, 0.42)" />
          <Handle x={face.x + face.width * 0.31} y={face.y + 7} width={Math.min(10, face.width * 0.3)} />
          <Handle x={face.x + face.width * 0.69} y={face.y + 7} width={Math.min(10, face.width * 0.3)} />
        </>
      )}

      {!isOven && !isShelfDrawer && !isThreeDrawers && !isTwoDoors && (
        <Handle
          x={face.x + face.width / 2}
          y={isFlap ? face.y + face.height - 8 : face.y + 7}
          width={Math.min(isTall ? 17 : 21, face.width - 8)}
        />
      )}

      {!isUpper && (
        <>
          <line x1={face.x + 5} x2={face.x + 5} y1={face.y + face.height} y2={face.y + face.height + 3} stroke="#777c79" strokeWidth="1.4" />
          <line x1={face.x + face.width - 5} x2={face.x + face.width - 5} y1={face.y + face.height} y2={face.y + face.height + 3} stroke="#777c79" strokeWidth="1.4" />
        </>
      )}
    </svg>
  )
}

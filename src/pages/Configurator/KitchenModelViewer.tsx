import { Suspense, useLayoutEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Edges, Environment, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { getModelUrl } from './modelCatalog'

type CabinetCategory = 'תחתונים' | 'כיור' | 'גבוהים' | 'עליונים'

type CartItem3D = {
  id: string
  qty: number
  width: number
  category: CabinetCategory
  subtitle: string
  modelSlug?: string
}

type Props = {
  cartItems: CartItem3D[]
  colorHex: string
  colorId: string
  wallLengthCm?: number | null
}

const CM = 0.01

// Matches the real per-SKU models' measured dimensions (legs + overhang add
// a few cm on top of the spec sheet's nominal carcass sizes), so the
// countertop and procedural fallback boxes align with the real geometry.
const CATEGORY_SPEC: Record<CabinetCategory, { height: number; depth: number; elevation: number }> = {
  'תחתונים': { height: 87.5 * CM, depth: 64 * CM, elevation: 0 },
  'כיור': { height: 87.5 * CM, depth: 64 * CM, elevation: 0 },
  'גבוהים': { height: 225 * CM, depth: 64 * CM, elevation: 0 },
  'עליונים': { height: 78 * CM, depth: 32 * CM, elevation: 150 * CM },
}

const GAP = 0.01
const COUNTERTOP_HEIGHT = CATEGORY_SPEC['תחתונים'].height
const COUNTERTOP_DEPTH = CATEGORY_SPEC['תחתונים'].depth

function doorCount(subtitle: string): number {
  const match = subtitle.match(/(\d+)\s*דלתות/)
  if (match) return Number(match[1])
  if (subtitle.includes('דלת')) return 1
  return 0
}

function isOven(subtitle: string): boolean {
  return subtitle.includes('תנור')
}

function OvenFront({ width, height, depth }: { width: number; height: number; depth: number }) {
  const panelWidth = width * 0.82
  const panelHeight = height * 0.5
  const centerY = height * 0.58
  return (
    <group position={[0, centerY, depth + 0.002]}>
      <mesh>
        <boxGeometry args={[panelWidth, panelHeight, 0.015]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, panelHeight / 2 - 0.035, 0.009]}>
        <boxGeometry args={[panelWidth * 0.9, 0.018, 0.005]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

function ProceduralCabinet({ width, height, depth, color, subtitle }: { width: number; height: number; depth: number; color: string; subtitle: string }) {
  const doors = doorCount(subtitle)
  const doorLines = useMemo(() => {
    if (doors < 2) return []
    const lines: number[] = []
    for (let i = 1; i < doors; i++) {
      lines.push(-width / 2 + (width / doors) * i)
    }
    return lines
  }, [doors, width])

  return (
    <>
      <mesh position={[0, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.65} />
        <Edges scale={1} color="#00000040" />
      </mesh>
      {doorLines.map((lx, i) => (
        <Line
          key={i}
          points={[
            [lx, 0.02, depth + 0.001],
            [lx, height - 0.02, depth + 0.001],
          ]}
          color="#00000055"
          lineWidth={1}
        />
      ))}
      {isOven(subtitle) && <OvenFront width={width} height={height} depth={depth} />}
    </>
  )
}

function RealCabinetModel({ url, width }: { url: string; width: number }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => scene.clone(true), [scene])

  useLayoutEffect(() => {
    const box = new Box3().setFromObject(cloned)
    const size = new Vector3()
    box.getSize(size)
    if (size.x > 0.0001) {
      cloned.scale.setScalar(width / size.x)
    }
    const aligned = new Box3().setFromObject(cloned)
    cloned.position.x -= (aligned.min.x + aligned.max.x) / 2
    cloned.position.y -= aligned.min.y
    cloned.position.z -= aligned.min.z
    cloned.traverse(node => {
      const mesh = node as unknown as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean }
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
  }, [cloned, width])

  return <primitive object={cloned} />
}

type Placed = { item: CartItem3D; x: number; width: number; spec: (typeof CATEGORY_SPEC)[CabinetCategory]; key: string }

function layoutRow(items: CartItem3D[]): Placed[] {
  let cursor = 0
  const placed: Placed[] = []
  items.forEach((item, i) => {
    const spec = CATEGORY_SPEC[item.category]
    const w = item.width * CM
    placed.push({ item, x: cursor + w / 2, width: w, spec, key: `${item.id}-${i}` })
    cursor += w + GAP
  })
  return placed
}

function Cabinet({ x, width, spec, color, subtitle, modelUrl }: { x: number; width: number; spec: (typeof CATEGORY_SPEC)[CabinetCategory]; color: string; subtitle: string; modelUrl?: string }) {
  const { height, depth, elevation } = spec
  const fallback = <ProceduralCabinet width={width} height={height} depth={depth} color={color} subtitle={subtitle} />

  return (
    <group position={[x, elevation, 0]}>
      {modelUrl ? (
        <Suspense fallback={fallback}>
          <RealCabinetModel url={modelUrl} width={width} />
        </Suspense>
      ) : (
        fallback
      )}
    </group>
  )
}

function WallGuide({ lengthM, exceeds }: { lengthM: number; exceeds: boolean }) {
  const half = lengthM / 2
  const color = exceeds ? '#c0392b' : '#2f6f4f'
  const tickHeight = 0.08
  return (
    <group>
      <Line points={[[-half, 0.002, 0], [half, 0.002, 0]]} color={color} lineWidth={2} />
      <Line points={[[-half, 0.002, 0], [-half, tickHeight, 0]]} color={color} lineWidth={2} />
      <Line points={[[half, 0.002, 0], [half, tickHeight, 0]]} color={color} lineWidth={2} />
      <Text position={[0, tickHeight + 0.05, 0]} fontSize={0.09} color={color} anchorX="center" anchorY="bottom">
        {`${Math.round(lengthM * 100)} ס"מ${exceeds ? ' - חריגה!' : ''}`}
      </Text>
    </group>
  )
}

function Countertop({ width, x }: { width: number; x: number }) {
  if (width <= 0) return null
  return (
    <mesh position={[x, COUNTERTOP_HEIGHT + 0.015, COUNTERTOP_DEPTH / 2 - 0.02]} castShadow receiveShadow>
      <boxGeometry args={[width + GAP, 0.03, COUNTERTOP_DEPTH + 0.06]} />
      <meshStandardMaterial color="#f5f3ef" roughness={0.3} />
    </mesh>
  )
}

export default function KitchenModelViewer({ cartItems, colorHex, colorId, wallLengthCm }: Props) {
  const floorItems = useMemo(
    () => cartItems.filter(item => item.category !== 'עליונים').flatMap(item => Array(item.qty).fill(item)),
    [cartItems]
  )
  const wallItems = useMemo(
    () => cartItems.filter(item => item.category === 'עליונים').flatMap(item => Array(item.qty).fill(item)),
    [cartItems]
  )

  // Tall units go floor-to-ceiling, so they're placed after the counter run —
  // wall cabinets are only ever positioned above the counter run, never above a tall unit.
  const orderedFloorItems = useMemo(() => {
    const counterItems = floorItems.filter(item => item.category !== 'גבוהים')
    const tallItems = floorItems.filter(item => item.category === 'גבוהים')
    return { counterItems, tallItems, all: [...counterItems, ...tallItems] }
  }, [floorItems])

  const floorRow = useMemo(() => layoutRow(orderedFloorItems.all), [orderedFloorItems])
  const wallRow = useMemo(() => layoutRow(wallItems), [wallItems])

  const counterSpan = orderedFloorItems.counterItems.length
    ? floorRow[orderedFloorItems.counterItems.length - 1].x + floorRow[orderedFloorItems.counterItems.length - 1].width / 2
    : 0
  const floorSpan = floorRow.length ? floorRow[floorRow.length - 1].x + floorRow[floorRow.length - 1].width / 2 : 0
  const wallSpan = wallRow.length ? wallRow[wallRow.length - 1].x + wallRow[wallRow.length - 1].width / 2 : 0
  const wallGuideM = wallLengthCm != null ? wallLengthCm * CM : undefined
  const totalSpan = Math.max(floorSpan, wallSpan, wallGuideM ?? 0, 1.5)
  const offsetX = -totalSpan / 2
  const exceedsWall = wallGuideM !== undefined && floorSpan > wallGuideM

  return (
    <Canvas shadows camera={{ position: [totalSpan * 0.6, 1.5, totalSpan * 1.1 + 2], fov: 45 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} castShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e9e7e2" />
      </mesh>

      <mesh position={[0, 1.3, -0.02]} receiveShadow>
        <planeGeometry args={[Math.max(totalSpan + 1, 3), 2.6]} />
        <meshStandardMaterial color="#f1efe9" roughness={0.9} />
      </mesh>

      <group position={[offsetX, 0, 0]}>
        {floorRow.map(({ item, x, width, spec, key }) => (
          <Cabinet key={key} x={x} width={width} spec={spec} color={colorHex} subtitle={item.subtitle} modelUrl={getModelUrl(item.modelSlug, colorId)} />
        ))}
        <Countertop width={counterSpan} x={counterSpan / 2} />
        {wallRow.map(({ item, x, width, spec, key }) => (
          <Cabinet key={key} x={x} width={width} spec={spec} color={colorHex} subtitle={item.subtitle} modelUrl={getModelUrl(item.modelSlug, colorId)} />
        ))}
      </group>

      {wallGuideM !== undefined && <WallGuide lengthM={wallGuideM} exceeds={exceedsWall} />}

      <OrbitControls makeDefault target={[0, 0.9, 0]} minDistance={1} maxDistance={12} />
      <Environment preset="apartment" />
    </Canvas>
  )
}

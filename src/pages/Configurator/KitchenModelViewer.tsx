import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Edges, Environment, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { getModelUrl } from './modelCatalog'
import { colorHexOf } from './colors'
import {
  buildCabinetLayout,
  COUNTERTOP_DEPTH_CM,
  COUNTERTOP_HEIGHT_CM,
  doorCount,
  isOven,
  type CabinetLayoutItem,
  type CategorySpec,
} from './cabinetLayout'

type Props = {
  cartItems: CabinetLayoutItem[]
  wallLengthCm?: number | null
}

const CM = 0.01
const GAP_M = 0.01

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
  // Measure/scale/align on a fresh clone inside the memo — mutating the clone
  // in an effect is not idempotent (StrictMode's double effect run re-measured
  // the already-scaled model and reset its scale to the raw GLB units).
  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    const box = new Box3().setFromObject(clone)
    const size = new Vector3()
    box.getSize(size)
    if (size.x > 0.0001) {
      clone.scale.setScalar(width / size.x)
    }
    const aligned = new Box3().setFromObject(clone)
    clone.position.x -= (aligned.min.x + aligned.max.x) / 2
    clone.position.y -= aligned.min.y
    clone.position.z -= aligned.min.z
    clone.traverse(node => {
      const mesh = node as unknown as { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean }
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return clone
  }, [scene, width])

  return <primitive object={cloned} />
}

function Cabinet({ x, width, spec, color, subtitle, modelUrl }: { x: number; width: number; spec: CategorySpec; color: string; subtitle: string; modelUrl?: string }) {
  const height = spec.height * CM
  const depth = spec.depth * CM
  const elevation = spec.elevation * CM
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
  const height = COUNTERTOP_HEIGHT_CM * CM
  const depth = COUNTERTOP_DEPTH_CM * CM
  return (
    <mesh position={[x, height + 0.015, depth / 2 - 0.02]} castShadow receiveShadow>
      <boxGeometry args={[width + GAP_M, 0.03, depth + 0.06]} />
      <meshStandardMaterial color="#f5f3ef" roughness={0.3} />
    </mesh>
  )
}

export default function KitchenModelViewer({ cartItems, wallLengthCm }: Props) {
  const layout = useMemo(() => buildCabinetLayout(cartItems), [cartItems])

  const floorRow = layout.floorRow.map(p => ({ ...p, x: p.x * CM, width: p.width * CM }))
  const wallRow = layout.wallRow.map(p => ({ ...p, x: p.x * CM, width: p.width * CM }))
  const counterSpan = layout.counterSpan * CM
  const floorSpan = layout.floorSpan * CM
  const wallSpan = layout.wallSpan * CM

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
          <Cabinet key={key} x={x} width={width} spec={spec} color={colorHexOf(item.colorId)} subtitle={item.subtitle} modelUrl={getModelUrl(item.modelSlug, item.colorId)} />
        ))}
        <Countertop width={counterSpan} x={counterSpan / 2} />
        {wallRow.map(({ item, x, width, spec, key }) => (
          <Cabinet key={key} x={x} width={width} spec={spec} color={colorHexOf(item.colorId)} subtitle={item.subtitle} modelUrl={getModelUrl(item.modelSlug, item.colorId)} />
        ))}
      </group>

      {wallGuideM !== undefined && <WallGuide lengthM={wallGuideM} exceeds={exceedsWall} />}

      <OrbitControls makeDefault target={[0, 0.9, 0]} minDistance={1} maxDistance={12} />
      <Environment preset="apartment" />
    </Canvas>
  )
}

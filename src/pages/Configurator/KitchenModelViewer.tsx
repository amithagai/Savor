import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { Edges, Environment, Html, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import {
  ACESFilmicToneMapping,
  Box3,
  Color,
  type Mesh,
  Plane,
  Vector3,
} from 'three'
import { addSketchUpModelOutlines } from '../../lib/modelOutlines'
import { getModelUrl } from './modelCatalog'
import { colorHexOf } from './colors'
import {
  buildCabinetLayout,
  cabinetDragPositionUpdates,
  COUNTERTOP_DEPTH_CM,
  COUNTERTOP_HEIGHT_CM,
  doorCount,
  HANDLE_TOP_OFFSET_CM,
  isOven,
  PLINTH_HEIGHT_CM,
  PLINTH_RECESS_CM,
  type AccessoryPositions,
  type CabinetLayout,
  type CabinetLayoutItem,
  type CabinetPositions,
  type CategorySpec,
  type CounterRun,
  type KitchenAccessoryId,
} from './cabinetLayout'

type Props = {
  cartItems: CabinetLayoutItem[]
  wallLengthCm?: number | null
  positions: CabinetPositions
  onPositionsChange: (positions: CabinetPositions) => void
  accessories: AccessoryPositions
  onAccessoryPositionChange: (id: KitchenAccessoryId, xCm: number) => void
}

type InteractionMode = 'orbit' | 'move'

const CM = 0.01
const GAP_M = 0.01
const HANDLE_TOP_OFFSET_M = HANDLE_TOP_OFFSET_CM * CM

function ModelLoadingFallback() {
  return (
    <Html center>
      <div className="cfg3d__loader" role="status" aria-live="polite">
        <span className="cfg3d__loader-spinner" aria-hidden="true" />
        <span>טוען את דגמי המטבח…</span>
      </div>
    </Html>
  )
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
  const displayColor = useMemo(() => new Color(color).offsetHSL(0, 0, -0.1), [color])
  const doorLines = useMemo(() => {
    if (doors < 2) return []
    return Array.from({ length: doors - 1 }, (_, index) => -width / 2 + (width / doors) * (index + 1))
  }, [doors, width])

  return (
    <>
      <mesh position={[0, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={displayColor} roughness={0.72} />
        <Edges scale={1} color="#777777" />
      </mesh>
      {doorLines.map((lineX, index) => (
        <Line
          key={index}
          points={[[lineX, 0.02, depth + 0.001], [lineX, height - 0.02, depth + 0.001]]}
          color="#686868"
          lineWidth={1}
        />
      ))}
      {!isOven(subtitle) && (
        <mesh position={[0, height - HANDLE_TOP_OFFSET_M, depth + 0.012]} castShadow>
          <boxGeometry args={[Math.min(width * 0.55, 0.28), 0.018, 0.025]} />
          <meshStandardMaterial color="#454545" metalness={0.75} roughness={0.28} />
        </mesh>
      )}
      {isOven(subtitle) && <OvenFront width={width} height={height} depth={depth} />}
    </>
  )
}

function RealCabinetModel({ url, width }: {
  url: string
  width: number
}) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    // The source GLBs are authored with their doors on the maximum-Z side,
    // which already faces the configurator camera. Keep that orientation;
    // rotating the complete model would expose its plain rear panel instead.
    clone.updateMatrixWorld(true)
    const box = new Box3().setFromObject(clone)
    const size = new Vector3()
    box.getSize(size)
    if (size.x > 0.0001) clone.scale.setScalar(width / size.x)

    const aligned = new Box3().setFromObject(clone)
    clone.position.x -= (aligned.min.x + aligned.max.x) / 2
    clone.position.y -= aligned.min.y
    clone.position.z -= aligned.min.z

    clone.traverse(node => {
      const mesh = node as Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = false
      }
    })
    return clone
  }, [scene, width])

  useEffect(() => addSketchUpModelOutlines(cloned), [cloned])

  return <primitive object={cloned} />
}

class CabinetModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Could not load cabinet GLB; using the procedural fallback.', error, info)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

type DragHandlers = {
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void
  onPointerMove: (event: ThreeEvent<PointerEvent>) => void
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void
  onPointerCancel: (event: ThreeEvent<PointerEvent>) => void
}

function Cabinet({ x, width, spec, color, subtitle, modelUrl, active, dragHandlers }: {
  x: number
  width: number
  spec: CategorySpec
  color: string
  subtitle: string
  modelUrl?: string
  active: boolean
  dragHandlers?: DragHandlers
}) {
  const height = spec.height * CM
  const depth = spec.depth * CM
  const elevation = spec.elevation * CM
  const fallback = <ProceduralCabinet width={width} height={height} depth={depth} color={color} subtitle={subtitle} />

  return (
    <group position={[x, elevation, 0]} {...(dragHandlers ?? {})}>
      {modelUrl ? (
        <CabinetModelErrorBoundary key={modelUrl} fallback={fallback}>
          <RealCabinetModel url={modelUrl} width={width} />
        </CabinetModelErrorBoundary>
      ) : fallback}
      {active && (
        <mesh position={[0, height / 2, depth / 2]}>
          <boxGeometry args={[width + 0.035, height + 0.035, depth + 0.035]} />
          <meshBasicMaterial color="#377e2b" transparent opacity={0.13} depthWrite={false} />
          <Edges color="#377e2b" />
        </mesh>
      )}
    </group>
  )
}

function WallGuide({ startX, lengthM, exceeds }: { startX: number; lengthM: number; exceeds: boolean }) {
  const half = lengthM / 2
  const color = exceeds ? '#c0392b' : '#2f6f4f'
  const tickHeight = 0.08
  return (
    <group position={[startX + half, 0, 0]}>
      <Line points={[[-half, 0.002, 0], [half, 0.002, 0]]} color={color} lineWidth={2} />
      <Line points={[[-half, 0.002, 0], [-half, tickHeight, 0]]} color={color} lineWidth={2} />
      <Line points={[[half, 0.002, 0], [half, tickHeight, 0]]} color={color} lineWidth={2} />
      <Text position={[0, tickHeight + 0.05, 0]} fontSize={0.09} color={color} anchorX="center" anchorY="bottom">
        {`${Math.round(lengthM * 100)} ס"מ${exceeds ? ' - חריגה!' : ''}`}
      </Text>
    </group>
  )
}

function Countertop({ run }: { run: CounterRun }) {
  const width = (run.end - run.start) * CM
  const x = (run.start + run.end) * CM / 2
  const height = COUNTERTOP_HEIGHT_CM * CM
  const depth = COUNTERTOP_DEPTH_CM * CM
  if (width <= 0) return null
  return (
    <mesh position={[x, height + 0.015, depth / 2 - 0.02]} castShadow receiveShadow>
      <boxGeometry args={[width + GAP_M, 0.03, depth + 0.06]} />
      <meshStandardMaterial color="#d8d1c6" roughness={0.38} />
    </mesh>
  )
}

function Plinth({ run }: { run: CounterRun }) {
  const width = (run.end - run.start) * CM
  const x = (run.start + run.end) * CM / 2
  const height = PLINTH_HEIGHT_CM * CM
  const frontZ = (COUNTERTOP_DEPTH_CM - PLINTH_RECESS_CM) * CM
  if (width <= 0) return null
  return (
    <mesh position={[x, height / 2, frontZ]} castShadow receiveShadow>
      <boxGeometry args={[width, height, 0.025]} />
      <meshStandardMaterial color="#b9b0a4" roughness={0.65} />
    </mesh>
  )
}

function Sink({ x, active, dragHandlers }: { x: number; active: boolean; dragHandlers?: DragHandlers }) {
  const top = COUNTERTOP_HEIGHT_CM * CM + 0.037
  const z = COUNTERTOP_DEPTH_CM * CM * 0.57
  return (
    <group position={[x, top, z]} {...(dragHandlers ?? {})}>
      <mesh castShadow>
        <boxGeometry args={[0.52, 0.018, 0.42]} />
        <meshStandardMaterial color="#aeb3b4" metalness={0.72} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.45, 0.008, 0.35]} />
        <meshStandardMaterial color="#555d60" metalness={0.55} roughness={0.32} />
      </mesh>
      {active && (
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.57, 0.015, 0.47]} />
          <meshBasicMaterial color="#377e2b" transparent opacity={0.2} />
          <Edges color="#377e2b" />
        </mesh>
      )}
    </group>
  )
}

function Faucet({ x, active, dragHandlers }: { x: number; active: boolean; dragHandlers?: DragHandlers }) {
  const top = COUNTERTOP_HEIGHT_CM * CM + 0.045
  const metal = <meshStandardMaterial color="#aeb4b6" metalness={0.86} roughness={0.17} />
  return (
    <group position={[x, top, 0.12]} {...(dragHandlers ?? {})}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.32, 18]} />
        {metal}
      </mesh>
      <mesh position={[0, 0.31, 0.09]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.2, 18]} />
        {metal}
      </mesh>
      <mesh position={[0, 0.27, 0.19]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.09, 18]} />
        {metal}
      </mesh>
      {active && (
        <mesh position={[0, 0.17, 0.08]}>
          <boxGeometry args={[0.12, 0.4, 0.32]} />
          <meshBasicMaterial color="#377e2b" transparent opacity={0.12} depthWrite={false} />
          <Edges color="#377e2b" />
        </mesh>
      )}
    </group>
  )
}

type DragState = {
  type: 'cabinet' | 'accessory'
  key: string
  widthCm: number
  offsetM: number
}

type SceneProps = Props & {
  interactionMode: InteractionMode
  layout: CabinetLayout
}

type PendingDragUpdate = {
  cabinetPositions?: CabinetPositions
  accessory?: { id: KitchenAccessoryId; xCm: number }
}

function useDragUpdateScheduler(
  onPositionsChange: Props['onPositionsChange'],
  onAccessoryPositionChange: Props['onAccessoryPositionChange'],
) {
  const pendingUpdate = useRef<PendingDragUpdate>({})
  const updateFrame = useRef<number | null>(null)

  const commitPendingUpdate = useCallback(() => {
    updateFrame.current = null
    const pending = pendingUpdate.current
    pendingUpdate.current = {}
    if (pending.cabinetPositions && Object.keys(pending.cabinetPositions).length > 0) {
      onPositionsChange(pending.cabinetPositions)
    }
    if (pending.accessory) {
      onAccessoryPositionChange(pending.accessory.id, pending.accessory.xCm)
    }
  }, [onAccessoryPositionChange, onPositionsChange])

  const scheduleUpdate = useCallback((update: PendingDragUpdate) => {
    pendingUpdate.current = {
      cabinetPositions: update.cabinetPositions
        ? { ...pendingUpdate.current.cabinetPositions, ...update.cabinetPositions }
        : pendingUpdate.current.cabinetPositions,
      accessory: update.accessory ?? pendingUpdate.current.accessory,
    }
    if (updateFrame.current == null) {
      updateFrame.current = requestAnimationFrame(commitPendingUpdate)
    }
  }, [commitPendingUpdate])

  const flushPendingUpdate = useCallback(() => {
    if (updateFrame.current == null) return
    cancelAnimationFrame(updateFrame.current)
    commitPendingUpdate()
  }, [commitPendingUpdate])

  useEffect(() => () => {
    if (updateFrame.current != null) cancelAnimationFrame(updateFrame.current)
  }, [])

  return { flushPendingUpdate, scheduleUpdate }
}

function ConfiguratorScene({ layout, wallLengthCm, onPositionsChange, accessories, onAccessoryPositionChange, interactionMode }: SceneProps) {
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const [drag, setDrag] = useState<DragState | null>(null)
  const { flushPendingUpdate, scheduleUpdate } = useDragUpdateScheduler(
    onPositionsChange,
    onAccessoryPositionChange,
  )
  const activeKey = drag ? `${drag.type}-${drag.key}` : null

  const designWidthCm = Math.max(wallLengthCm ?? 0, layout.floorEnd, layout.wallEnd, 150)
  const totalSpan = designWidthCm * CM
  const offsetX = -totalSpan / 2
  const wallGuideM = wallLengthCm != null ? wallLengthCm * CM : undefined
  const exceedsWall = wallLengthCm != null && Math.max(layout.floorEnd, layout.wallEnd) > wallLengthCm

  function pointOnDragPlane(event: ThreeEvent<PointerEvent>) {
    return event.ray.intersectPlane(dragPlane, new Vector3())
  }

  function startDrag(event: ThreeEvent<PointerEvent>, type: DragState['type'], key: string, xCm: number, widthCm: number) {
    event.stopPropagation()
    const point = pointOnDragPlane(event)
    if (!point) return
    setDrag({ type, key, widthCm, offsetM: xCm * CM + offsetX - point.x })
    const target = event.target as unknown as { setPointerCapture?: (pointerId: number) => void }
    target.setPointerCapture?.(event.pointerId)
  }

  function clampAccessoryX(xCm: number, widthCm: number) {
    if (layout.counterRuns.length === 0) return xCm
    const half = widthCm / 2
    const choices = layout.counterRuns.map(run => {
      const min = run.start + half
      const max = run.end - half
      const candidate = min <= max ? Math.min(Math.max(xCm, min), max) : (run.start + run.end) / 2
      return { candidate, distance: Math.abs(candidate - xCm) }
    })
    return choices.sort((a, b) => a.distance - b.distance)[0].candidate
  }

  function moveDrag(event: ThreeEvent<PointerEvent>) {
    if (!drag) return
    event.stopPropagation()
    const point = pointOnDragPlane(event)
    if (!point) return
    const rawX = (point.x + drag.offsetM - offsetX) / CM
    if (drag.type === 'cabinet') {
      const updates = cabinetDragPositionUpdates(
        [...layout.floorRow, ...layout.wallRow],
        drag.key,
        rawX,
        designWidthCm,
      )
      const roundedUpdates = Object.fromEntries(
        Object.entries(updates).map(([key, x]) => [key, Math.round(x)]),
      )
      if (Object.keys(roundedUpdates).length > 0) {
        scheduleUpdate({ cabinetPositions: roundedUpdates })
      }
    } else {
      scheduleUpdate({
        accessory: {
          id: drag.key as KitchenAccessoryId,
          xCm: Math.round(clampAccessoryX(rawX, drag.widthCm)),
        },
      })
    }
  }

  function endDrag(event: ThreeEvent<PointerEvent>) {
    if (!drag) return
    event.stopPropagation()
    const target = event.target as unknown as { releasePointerCapture?: (pointerId: number) => void }
    target.releasePointerCapture?.(event.pointerId)
    flushPendingUpdate()
    setDrag(null)
  }

  function handlers(type: DragState['type'], key: string, xCm: number, widthCm: number): DragHandlers {
    return {
      onPointerDown: event => startDrag(event, type, key, xCm, widthCm),
      onPointerMove: event => moveDrag(event),
      onPointerUp: event => endDrag(event),
      onPointerCancel: event => endDrag(event),
    }
  }

  const floorRow = layout.floorRow.map(placed => ({ ...placed, xM: placed.x * CM, widthM: placed.width * CM }))
  const wallRow = layout.wallRow.map(placed => ({ ...placed, xM: placed.x * CM, widthM: placed.width * CM }))

  return (
    <>
      <color attach="background" args={['#cbc5bb']} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[3, 5, 4]} intensity={1.08} castShadow />
      <directionalLight position={[-3, 2, 1]} intensity={0.18} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#aaa399" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.3, -0.03]} receiveShadow>
        <planeGeometry args={[Math.max(totalSpan + 1, 3), 2.6]} />
        <meshStandardMaterial color="#cec7bd" roughness={0.95} />
      </mesh>

      <group position={[offsetX, 0, 0]}>
        {floorRow.map(({ item, x, xM, width, widthM, spec, key }) => (
          <Cabinet
            key={key}
            x={xM}
            width={widthM}
            spec={spec}
            color={item.colorHex ?? colorHexOf(item.colorId)}
            subtitle={item.subtitle}
            modelUrl={item.modelUrl ?? getModelUrl(item.modelSlug, item.colorId)}
            active={activeKey === `cabinet-${key}`}
            dragHandlers={interactionMode === 'move' ? handlers('cabinet', key, x, width) : undefined}
          />
        ))}
        {layout.counterRuns.map((run, index) => <Countertop key={`counter-${index}`} run={run} />)}
        {layout.counterRuns.map((run, index) => <Plinth key={`plinth-${index}`} run={run} />)}
        {wallRow.map(({ item, x, xM, width, widthM, spec, key }) => (
          <Cabinet
            key={key}
            x={xM}
            width={widthM}
            spec={spec}
            color={item.colorHex ?? colorHexOf(item.colorId)}
            subtitle={item.subtitle}
            modelUrl={item.modelUrl ?? getModelUrl(item.modelSlug, item.colorId)}
            active={activeKey === `cabinet-${key}`}
            dragHandlers={interactionMode === 'move' ? handlers('cabinet', key, x, width) : undefined}
          />
        ))}
        {accessories.sink != null && layout.counterRuns.length > 0 && (
          <Sink
            x={accessories.sink * CM}
            active={activeKey === 'accessory-sink'}
            dragHandlers={interactionMode === 'move' ? handlers('accessory', 'sink', accessories.sink, 52) : undefined}
          />
        )}
        {accessories.faucet != null && layout.counterRuns.length > 0 && (
          <Faucet
            x={accessories.faucet * CM}
            active={activeKey === 'accessory-faucet'}
            dragHandlers={interactionMode === 'move' ? handlers('accessory', 'faucet', accessories.faucet, 8) : undefined}
          />
        )}
      </group>

      {wallGuideM !== undefined && <WallGuide startX={offsetX} lengthM={wallGuideM} exceeds={exceedsWall} />}
      <OrbitControls
        makeDefault
        enabled={activeKey == null}
        target={[0, 0.95, 0.2]}
        minDistance={1.8}
        maxDistance={10}
        minPolarAngle={Math.PI * 0.08}
        maxPolarAngle={Math.PI * 0.49}
        enablePan={false}
      />
      <Environment preset="studio" environmentIntensity={0.38} />
    </>
  )
}

export default function KitchenModelViewer(props: Props) {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('orbit')
  const layout = useMemo(
    () => buildCabinetLayout(props.cartItems, props.positions),
    [props.cartItems, props.positions],
  )
  const designWidthM = Math.max(props.wallLengthCm ?? 0, layout.floorEnd, layout.wallEnd, 150) * CM

  return (
    <div className="cfg3d__viewer">
      <div className="cfg3d__interaction-toggle" role="group" aria-label="מצב שליטה בתצוגת תלת־ממד">
        <button
          type="button"
          className={`cfg3d__interaction-btn${interactionMode === 'orbit' ? ' cfg3d__interaction-btn--active' : ''}`}
          aria-pressed={interactionMode === 'orbit'}
          onClick={() => setInteractionMode('orbit')}
        >
          סיבוב 360°
        </button>
        <button
          type="button"
          className={`cfg3d__interaction-btn${interactionMode === 'move' ? ' cfg3d__interaction-btn--active' : ''}`}
          aria-pressed={interactionMode === 'move'}
          onClick={() => setInteractionMode('move')}
        >
          הזזת פריטים
        </button>
      </div>
      <Canvas
        shadows="basic"
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => { gl.toneMappingExposure = 0.78 }}
        camera={{ position: [designWidthM * 0.58, 1.5, designWidthM * 1.05 + 2], fov: 45 }}
      >
        <Suspense fallback={<ModelLoadingFallback />}>
          <ConfiguratorScene {...props} layout={layout} interactionMode={interactionMode} />
        </Suspense>
      </Canvas>
    </div>
  )
}

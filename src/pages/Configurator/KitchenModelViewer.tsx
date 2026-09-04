import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { Edges, Html, Line, OrbitControls, useGLTF } from '@react-three/drei'
import {
  Box3,
  type Material,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  NoToneMapping,
  SRGBColorSpace,
  type Mesh,
  Plane,
  Vector3,
} from 'three'
import { addSketchUpModelOutlines } from '../../lib/modelOutlines'
import {
  buildCabinetLayout,
  cabinetDragPositionUpdates,
  COUNTERTOP_DEPTH_CM,
  COUNTERTOP_HEIGHT_CM,
  DEFAULT_WALL_LENGTH_CM,
  ROOM_DEPTH_CM,
  snapCabinetPlacementToRoom,
  snapCabinetXToWall,
  WALL_HEIGHT_CM,
  type AccessoryPositions,
  type CabinetLayout,
  type CabinetLayoutItem,
  type CabinetPositions,
  type CabinetSpatialPlacement,
  type CabinetSpatialPositions,
  type CategorySpec,
  type CounterRun,
  type KitchenAccessoryId,
} from './cabinetLayout'

type Props = {
  cartItems: CabinetLayoutItem[]
  faucetItems: Array<{ id: string; width: number; modelUrl?: string }>
  wallLengthCm?: number | null
  positions: CabinetPositions
  onPositionsChange: (positions: CabinetPositions) => void
  spatialPositions: CabinetSpatialPositions
  onSpatialPositionChange: (key: string, placement: CabinetSpatialPlacement) => void
  accessories: AccessoryPositions
  onAccessoryPositionChange: (id: KitchenAccessoryId, xCm: number) => void
  showCountertop: boolean
}

type InteractionMode = 'orbit' | 'move'

const CM = 0.01

function createSketchUpDisplayMaterial(source: Material) {
  const standard = source as MeshStandardMaterial
  if (!standard.isMeshStandardMaterial) return source.clone()

  const display = new MeshBasicMaterial({
    alphaMap: standard.alphaMap,
    alphaTest: standard.alphaTest,
    color: standard.color,
    colorWrite: standard.colorWrite,
    depthTest: standard.depthTest,
    depthWrite: standard.depthWrite,
    fog: standard.fog,
    map: standard.map,
    opacity: standard.opacity,
    side: standard.side,
    toneMapped: false,
    transparent: standard.transparent,
    vertexColors: standard.vertexColors,
    wireframe: standard.wireframe,
  })
  display.name = source.name
  display.userData = { ...source.userData }
  return display
}

function isGoldAccentMesh(mesh: Mesh) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  return materials.length > 0 && materials.every(material => material.name.toLowerCase().includes('gold'))
}

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

function RealCabinetModel({ url, width, showOutlines }: {
  url: string
  width: number
  showOutlines: boolean
}) {
  const { scene } = useGLTF(url)
  const normalized = useMemo(() => {
    const clone = scene.clone(true)
    const displayMaterials = new Set<Material>()
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
        const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        const replacements = sourceMaterials.map(createSketchUpDisplayMaterial)
        replacements.forEach(material => displayMaterials.add(material))
        mesh.material = Array.isArray(mesh.material) ? replacements : replacements[0]
        mesh.castShadow = true
        mesh.receiveShadow = false
      }
    })
    return { displayMaterials, object: clone }
  }, [scene, width])

  useEffect(() => {
    if (!showOutlines) return
    return addSketchUpModelOutlines(normalized.object, {
      // Thin gold handles already carry a baked SketchUp texture. A full edge
      // overlay covers that texture at configurator scale and makes it black.
      shouldOutlineMesh: mesh => !isGoldAccentMesh(mesh),
    })
  }, [normalized, showOutlines])

  useEffect(() => () => {
    normalized.displayMaterials.forEach(material => material.dispose())
  }, [normalized])

  return <primitive object={normalized.object} />
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
    console.error('Could not load the uploaded cabinet GLB; no substitute model will be shown.', error, info)
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

function Cabinet({ x, width, spec, modelUrl, active, showOutlines, dragHandlers }: {
  x: number
  width: number
  spec: CategorySpec
  modelUrl?: string
  active: boolean
  showOutlines: boolean
  dragHandlers?: DragHandlers
}) {
  const height = spec.height * CM
  const depth = spec.depth * CM
  const elevation = spec.elevation * CM
  const unavailable = (
    <Html center>
      <div className="cfg3d__model-error" role="alert">המודל שהועלה לא נטען</div>
    </Html>
  )

  return (
    <group position={[x, elevation, 0]} {...(dragHandlers ?? {})}>
      {modelUrl ? (
        <CabinetModelErrorBoundary key={modelUrl} fallback={unavailable}>
          <>
            <RealCabinetModel url={modelUrl} width={width} showOutlines={showOutlines} />
            {active && (
              <mesh position={[0, height / 2, depth / 2]}>
                <boxGeometry args={[width + 0.035, height + 0.035, depth + 0.035]} />
                <meshBasicMaterial color="#377e2b" transparent opacity={0.13} depthWrite={false} />
                <Edges color="#377e2b" />
              </mesh>
            )}
          </>
        </CabinetModelErrorBoundary>
      ) : unavailable}
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
      <Html position={[0, tickHeight + 0.05, 0]} center>
        <span
          style={{
            color,
            direction: 'rtl',
            fontSize: '12px',
            fontWeight: 700,
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {`${Math.round(lengthM * 100)} ס"מ${exceeds ? ' - חריגה!' : ''}`}
        </span>
      </Html>
    </group>
  )
}

function CameraFraming({ sceneWidthM }: { sceneWidthM: number }) {
  const { camera, invalidate } = useThree()

  useEffect(() => {
    const roomDepthM = ROOM_DEPTH_CM * CM
    camera.position.set(sceneWidthM * 0.58, 1.6, Math.max(sceneWidthM * 1.05 + 2, roomDepthM + 1.25))
    camera.lookAt(0, 0.95, roomDepthM * 0.34)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, invalidate, sceneWidthM])

  return null
}

function WallSnapIndicator({ wall, topM }: { wall: CabinetSpatialPlacement['wall']; topM: number }) {
  if (wall === 'free') return null
  const label = wall === 'back' ? 'נצמד לקיר האחורי' : wall === 'left' ? 'נצמד לקיר השמאלי' : 'נצמד לקיר הימני'
  return (
    <Html position={[0, topM + 0.12, 0]} center>
      <div className="cfg3d__snap-indicator">{label}</div>
    </Html>
  )
}

function Countertop({ run }: { run: CounterRun }) {
  const width = (run.end - run.start) * CM
  const x = (run.start + run.end) * CM / 2
  const height = COUNTERTOP_HEIGHT_CM * CM
  const depth = COUNTERTOP_DEPTH_CM * CM
  if (width <= 0) return null

  return (
    <mesh position={[x, height + 0.015, depth / 2]} castShadow>
      <boxGeometry args={[width, 0.03, depth]} />
      <meshBasicMaterial color="#d8d1c6" toneMapped={false} />
    </mesh>
  )
}

function UploadedFaucet({ x, width, modelUrl, showOutlines, dragHandlers }: {
  x: number
  width: number
  modelUrl?: string
  showOutlines: boolean
  dragHandlers?: DragHandlers
}) {
  const top = COUNTERTOP_HEIGHT_CM * CM + 0.045
  const unavailable = (
    <Html center>
      <div className="cfg3d__model-error" role="alert">מודל הברז שהועלה לא נטען</div>
    </Html>
  )
  return (
    <group position={[x, top, 0.12]} {...(dragHandlers ?? {})}>
      {modelUrl ? (
        <CabinetModelErrorBoundary key={modelUrl} fallback={unavailable}>
          <RealCabinetModel url={modelUrl} width={width} showOutlines={showOutlines} />
        </CabinetModelErrorBoundary>
      ) : unavailable}
    </group>
  )
}

type DragState = {
  type: 'cabinet' | 'accessory'
  key: string
  widthCm: number
  depthCm: number
  offsetXM: number
  offsetZM: number
}

type SceneProps = Props & {
  interactionMode: InteractionMode
  layout: CabinetLayout
}

type PendingDragUpdate = {
  cabinetPositions?: CabinetPositions
  spatialPlacement?: { key: string; placement: CabinetSpatialPlacement }
  accessory?: { id: KitchenAccessoryId; xCm: number }
}

function useDragUpdateScheduler(
  onPositionsChange: Props['onPositionsChange'],
  onSpatialPositionChange: Props['onSpatialPositionChange'],
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
    if (pending.spatialPlacement) {
      onSpatialPositionChange(pending.spatialPlacement.key, pending.spatialPlacement.placement)
    }
    if (pending.accessory) {
      onAccessoryPositionChange(pending.accessory.id, pending.accessory.xCm)
    }
  }, [onAccessoryPositionChange, onPositionsChange, onSpatialPositionChange])

  const scheduleUpdate = useCallback((update: PendingDragUpdate) => {
    pendingUpdate.current = {
      cabinetPositions: update.cabinetPositions
        ? { ...pendingUpdate.current.cabinetPositions, ...update.cabinetPositions }
        : pendingUpdate.current.cabinetPositions,
      spatialPlacement: update.spatialPlacement ?? pendingUpdate.current.spatialPlacement,
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

function ConfiguratorScene({
  layout,
  faucetItems = [],
  wallLengthCm,
  onPositionsChange,
  spatialPositions,
  onSpatialPositionChange,
  accessories,
  onAccessoryPositionChange,
  interactionMode,
  showCountertop,
}: SceneProps) {
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), [])
  const [drag, setDrag] = useState<DragState | null>(null)
  const { flushPendingUpdate, scheduleUpdate } = useDragUpdateScheduler(
    onPositionsChange,
    onSpatialPositionChange,
    onAccessoryPositionChange,
  )
  const activeKey = drag ? `${drag.type}-${drag.key}` : null
  const uploadedFaucet = faucetItems.find((item) => Boolean(item.modelUrl))
  const wallWidthCm = wallLengthCm ?? Math.max(layout.floorEnd, layout.wallEnd, DEFAULT_WALL_LENGTH_CM)
  const designWidthCm = Math.max(wallWidthCm, layout.floorEnd, layout.wallEnd, DEFAULT_WALL_LENGTH_CM)
  const totalSpan = designWidthCm * CM
  const offsetX = -totalSpan / 2
  const wallWidthM = wallWidthCm * CM
  const wallGuideM = wallLengthCm != null ? wallLengthCm * CM : undefined
  const exceedsWall = wallLengthCm != null && Math.max(layout.floorEnd, layout.wallEnd) > wallLengthCm

  function pointOnDragPlane(event: ThreeEvent<PointerEvent>) {
    return event.ray.intersectPlane(dragPlane, new Vector3())
  }

  function startDrag(
    event: ThreeEvent<PointerEvent>,
    type: DragState['type'],
    key: string,
    placement: CabinetSpatialPlacement,
    widthCm: number,
    depthCm: number,
  ) {
    event.stopPropagation()
    const point = pointOnDragPlane(event)
    if (!point) return
    setDrag({
      type,
      key,
      widthCm,
      depthCm,
      offsetXM: placement.xCm * CM + offsetX - point.x,
      offsetZM: placement.zCm * CM - point.z,
    })
    const target = event.currentTarget as unknown as { setPointerCapture?: (pointerId: number) => void }
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
    const rawX = (point.x + drag.offsetXM - offsetX) / CM
    const rawZ = (point.z + drag.offsetZM) / CM
    if (drag.type === 'cabinet') {
      const placement = snapCabinetPlacementToRoom(
        rawX,
        rawZ,
        drag.widthCm,
        drag.depthCm,
        wallWidthCm,
      )
      scheduleUpdate({ spatialPlacement: { key: drag.key, placement } })
      if (placement.wall !== 'back') return
      const updates = cabinetDragPositionUpdates(
        [...layout.floorRow, ...layout.wallRow],
        drag.key,
        snapCabinetXToWall(placement.xCm, drag.widthCm, wallWidthCm),
        wallWidthCm,
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
    const target = event.currentTarget as unknown as { releasePointerCapture?: (pointerId: number) => void }
    target.releasePointerCapture?.(event.pointerId)
    flushPendingUpdate()
    setDrag(null)
  }

  function handlers(
    type: DragState['type'],
    key: string,
    placement: CabinetSpatialPlacement,
    widthCm: number,
    depthCm: number,
  ): DragHandlers {
    return {
      onPointerDown: event => startDrag(event, type, key, placement, widthCm, depthCm),
      onPointerMove: event => moveDrag(event),
      onPointerUp: event => endDrag(event),
      onPointerCancel: event => endDrag(event),
    }
  }

  function spatialPlacement(key: string, xCm: number): CabinetSpatialPlacement {
    return spatialPositions[key] ?? { xCm, zCm: 0, wall: 'back' }
  }

  function rotationForWall(wall: CabinetSpatialPlacement['wall']) {
    if (wall === 'left') return Math.PI / 2
    if (wall === 'right') return -Math.PI / 2
    return 0
  }

  const floorRow = layout.floorRow.map(placed => ({
    ...placed,
    placement: spatialPlacement(placed.key, placed.x),
    widthM: placed.width * CM,
  }))
  const wallRow = layout.wallRow.map(placed => ({
    ...placed,
    placement: spatialPlacement(placed.key, placed.x),
    widthM: placed.width * CM,
  }))
  const roomDepthM = ROOM_DEPTH_CM * CM
  const wallHeightM = WALL_HEIGHT_CM * CM
  const wallLeftM = offsetX
  const wallRightM = offsetX + wallWidthM
  const wallCenterM = (wallLeftM + wallRightM) / 2

  return (
    <>
      <color attach="background" args={['#ffffff']} />
      <CameraFraming sceneWidthM={totalSpan} />
      {/* Preserve the authored SketchUp colors with neutral white lighting. */}
      <ambientLight color="#ffffff" intensity={2.3} />
      <directionalLight color="#ffffff" position={[3, 5, 4]} intensity={0.06} castShadow />
      <directionalLight color="#ffffff" position={[-3, 2, 1]} intensity={0.01} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[wallCenterM, -0.001, roomDepthM / 2]}
        receiveShadow
      >
        <planeGeometry args={[wallWidthM, roomDepthM]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[wallCenterM, wallHeightM / 2, -0.001]} receiveShadow>
        <planeGeometry args={[wallWidthM, wallHeightM]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[wallLeftM - 0.001, wallHeightM / 2, roomDepthM / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomDepthM, wallHeightM]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[wallRightM + 0.001, wallHeightM / 2, roomDepthM / 2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomDepthM, wallHeightM]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      <group>
        <Line
          points={[
            [wallLeftM, 0.006, 0.006],
            [wallLeftM, wallHeightM, 0.006],
          ]}
          color="#737373"
          lineWidth={1}
        />
        <Line
          points={[
            [wallRightM, 0.006, 0.006],
            [wallRightM, wallHeightM, 0.006],
          ]}
          color="#737373"
          lineWidth={1}
        />
        <Line
          points={[
            [wallLeftM, 0.006, 0.006],
            [wallRightM, 0.006, 0.006],
          ]}
          color="#737373"
          lineWidth={1}
        />
        <Line
          points={[
            [wallLeftM + 0.006, 0.006, 0],
            [wallLeftM + 0.006, 0.006, roomDepthM],
          ]}
          color="#737373"
          lineWidth={1}
        />
        <Line
          points={[
            [wallRightM - 0.006, 0.006, 0],
            [wallRightM - 0.006, 0.006, roomDepthM],
          ]}
          color="#737373"
          lineWidth={1}
        />
      </group>

      <group position={[offsetX, 0, 0]}>
        {floorRow.map(({ item, width, widthM, spec, key, placement }) => (
          <group
            key={key}
            name={`cabinet-placement-${key}-${placement.wall}`}
            position={[placement.xCm * CM, 0, placement.zCm * CM]}
            rotation={[0, rotationForWall(placement.wall), 0]}
          >
            <Cabinet
              x={0}
              width={widthM}
              spec={spec}
              modelUrl={item.modelUrl}
              active={activeKey === `cabinet-${key}`}
              showOutlines
              dragHandlers={interactionMode === 'move' ? handlers('cabinet', key, placement, width, spec.depth) : undefined}
            />
            {showCountertop && item.category !== 'גבוהים' && (
              <Countertop run={{ start: -width / 2, end: width / 2 }} />
            )}
            {(activeKey === `cabinet-${key}` || placement.wall === 'left' || placement.wall === 'right') && (
              <WallSnapIndicator wall={placement.wall} topM={(spec.elevation + spec.height) * CM} />
            )}
          </group>
        ))}
        {wallRow.map(({ item, width, widthM, spec, key, placement }) => (
          <group
            key={key}
            name={`cabinet-placement-${key}-${placement.wall}`}
            position={[placement.xCm * CM, 0, placement.zCm * CM]}
            rotation={[0, rotationForWall(placement.wall), 0]}
          >
            <Cabinet
              x={0}
              width={widthM}
              spec={spec}
              modelUrl={item.modelUrl}
              active={activeKey === `cabinet-${key}`}
              showOutlines
              dragHandlers={interactionMode === 'move' ? handlers('cabinet', key, placement, width, spec.depth) : undefined}
            />
            {(activeKey === `cabinet-${key}` || placement.wall === 'left' || placement.wall === 'right') && (
              <WallSnapIndicator wall={placement.wall} topM={(spec.elevation + spec.height) * CM} />
            )}
          </group>
        ))}
        {uploadedFaucet && accessories.faucet != null && layout.counterRuns.length > 0 && (
          <UploadedFaucet
            x={accessories.faucet * CM}
            width={uploadedFaucet.width * CM}
            modelUrl={uploadedFaucet.modelUrl}
            showOutlines
            dragHandlers={interactionMode === 'move'
              ? handlers('accessory', 'faucet', { xCm: accessories.faucet, zCm: 0, wall: 'back' }, 8, 8)
              : undefined}
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
    </>
  )
}

export default function KitchenModelViewer(props: Props) {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('orbit')
  const layout = useMemo(
    () => buildCabinetLayout(props.cartItems, props.positions),
    [props.cartItems, props.positions],
  )
  const wallWidthCm = props.wallLengthCm
    ?? Math.max(layout.floorEnd, layout.wallEnd, DEFAULT_WALL_LENGTH_CM)
  const designWidthM = Math.max(
    wallWidthCm,
    layout.floorEnd,
    layout.wallEnd,
    DEFAULT_WALL_LENGTH_CM,
  ) * CM

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
        gl={{
          antialias: true,
          toneMapping: NoToneMapping,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = SRGBColorSpace
          gl.toneMappingExposure = 1
        }}
        camera={{ position: [designWidthM * 0.58, 1.5, designWidthM * 1.05 + 2], fov: 45 }}
      >
        <Suspense fallback={<ModelLoadingFallback />}>
          <ConfiguratorScene {...props} layout={layout} interactionMode={interactionMode} />
        </Suspense>
      </Canvas>
    </div>
  )
}

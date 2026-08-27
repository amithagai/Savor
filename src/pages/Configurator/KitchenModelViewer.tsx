import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { Edges, Html, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
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
  COUNTERTOP_HEIGHT_CM,
  type AccessoryPositions,
  type CabinetLayout,
  type CabinetLayoutItem,
  type CabinetPositions,
  type CategorySpec,
  type KitchenAccessoryId,
} from './cabinetLayout'

type Props = {
  cartItems: CabinetLayoutItem[]
  faucetItems: Array<{ id: string; width: number; modelUrl?: string }>
  wallLengthCm?: number | null
  positions: CabinetPositions
  onPositionsChange: (positions: CabinetPositions) => void
  accessories: AccessoryPositions
  onAccessoryPositionChange: (id: KitchenAccessoryId, xCm: number) => void
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
      <Text position={[0, tickHeight + 0.05, 0]} fontSize={0.09} color={color} anchorX="center" anchorY="bottom">
        {`${Math.round(lengthM * 100)} ס"מ${exceeds ? ' - חריגה!' : ''}`}
      </Text>
    </group>
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

function ConfiguratorScene({ layout, faucetItems = [], wallLengthCm, onPositionsChange, accessories, onAccessoryPositionChange, interactionMode }: SceneProps) {
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const [drag, setDrag] = useState<DragState | null>(null)
  const { flushPendingUpdate, scheduleUpdate } = useDragUpdateScheduler(
    onPositionsChange,
    onAccessoryPositionChange,
  )
  const activeKey = drag ? `${drag.type}-${drag.key}` : null
  const uploadedFaucet = faucetItems.find((item) => Boolean(item.modelUrl))

  const designWidthCm = Math.max(wallLengthCm ?? 0, layout.floorEnd, layout.wallEnd, 150)
  const totalSpan = designWidthCm * CM
  const roomWidth = Math.max(totalSpan + 1, 3)
  const roomDepth = 3
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
      <color attach="background" args={['#ffffff']} />
      {/*
        Uploaded SketchUp materials already contain their intended display colors.
        Neutral, mostly ambient lighting keeps those colors distinct instead of
        tinting and compressing them through a photographic studio environment.
      */}
      <ambientLight color="#ffffff" intensity={2.3} />
      <directionalLight color="#ffffff" position={[3, 5, 4]} intensity={0.06} castShadow />
      <directionalLight color="#ffffff" position={[-3, 2, 1]} intensity={0.01} />

      <mesh position={[0, 1.3, -0.03]} receiveShadow>
        <planeGeometry args={[roomWidth, 2.6]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      <mesh
        position={[-roomWidth / 2, 1.3, roomDepth / 2 - 0.03]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomDepth, 2.6]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      <mesh
        position={[roomWidth / 2, 1.3, roomDepth / 2 - 0.03]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomDepth, 2.6]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      <group>
        <Line
          points={[
            [-roomWidth / 2, 0.006, 0.006],
            [-roomWidth / 2, 2.6, 0.006],
          ]}
          color="#737373"
          lineWidth={1}
        />
        <Line
          points={[
            [roomWidth / 2, 0.006, 0.006],
            [roomWidth / 2, 2.6, 0.006],
          ]}
          color="#737373"
          lineWidth={1}
        />
        <Line
          points={[
            [-roomWidth / 2, 0.006, 0.006],
            [roomWidth / 2, 0.006, 0.006],
          ]}
          color="#737373"
          lineWidth={1}
        />
        <Line
          points={[
            [-roomWidth / 2 + 0.006, 0.006, 0],
            [-roomWidth / 2 + 0.006, 0.006, roomDepth],
          ]}
          color="#737373"
          lineWidth={1}
        />
        <Line
          points={[
            [roomWidth / 2 - 0.006, 0.006, 0],
            [roomWidth / 2 - 0.006, 0.006, roomDepth],
          ]}
          color="#737373"
          lineWidth={1}
        />
      </group>

      <group position={[offsetX, 0, 0]}>
        {floorRow.map(({ item, x, xM, width, widthM, spec, key }) => (
          <Cabinet
            key={key}
            x={xM}
            width={widthM}
            spec={spec}
            modelUrl={item.modelUrl}
            active={activeKey === `cabinet-${key}`}
            showOutlines
            dragHandlers={interactionMode === 'move' ? handlers('cabinet', key, x, width) : undefined}
          />
        ))}
        {wallRow.map(({ item, x, xM, width, widthM, spec, key }) => (
          <Cabinet
            key={key}
            x={xM}
            width={widthM}
            spec={spec}
            modelUrl={item.modelUrl}
            active={activeKey === `cabinet-${key}`}
            showOutlines
            dragHandlers={interactionMode === 'move' ? handlers('cabinet', key, x, width) : undefined}
          />
        ))}
        {uploadedFaucet && accessories.faucet != null && layout.counterRuns.length > 0 && (
          <UploadedFaucet
            x={accessories.faucet * CM}
            width={uploadedFaucet.width * CM}
            modelUrl={uploadedFaucet.modelUrl}
            showOutlines
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

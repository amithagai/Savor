import { Component, Suspense, useEffect, useMemo, type ErrorInfo, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useGLTF } from '@react-three/drei'
import {
  ACESFilmicToneMapping,
  Box3,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  type Mesh,
  Vector3,
} from 'three'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const normalized = useMemo(() => {
    const object = scene.clone(true)
    const box = new Box3().setFromObject(object)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const scale = 1.45 / Math.max(size.x, size.y, size.z, 0.001)
    object.position.set(-center.x, -box.min.y, -center.z)
    object.traverse(node => {
      const mesh = node as Mesh
      if (!mesh.isMesh) return

      mesh.castShadow = true
      mesh.receiveShadow = true
    })

    return { object, scale }
  }, [scene])

  useEffect(() => {
    const outlines: LineSegments[] = []

    normalized.object.traverse(node => {
      const mesh = node as Mesh
      if (!mesh.isMesh) return

      // SketchUp-style outlines keep shallow, light-colored door details
      // legible without changing the uploaded model or its materials.
      const outline = new LineSegments(
        new EdgesGeometry(mesh.geometry, 5),
        new LineBasicMaterial({
          color: '#343530',
          transparent: true,
          opacity: 0.58,
          depthWrite: false,
        }),
      )
      outline.renderOrder = 1
      mesh.add(outline)
      outlines.push(outline)
    })

    return () => {
      outlines.forEach(outline => {
        outline.removeFromParent()
        outline.geometry.dispose()
        if (Array.isArray(outline.material)) {
          outline.material.forEach(material => material.dispose())
        } else {
          outline.material.dispose()
        }
      })
    }
  }, [normalized.object])

  return (
    <group scale={normalized.scale}>
      <primitive object={normalized.object} />
    </group>
  )
}

class PreviewErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The upload endpoint validates the GLB header; this fallback covers load,
    // storage/CORS and malformed scene data errors without breaking the editor.
    void error
    void info
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function AdminModelPreview({ url }: { url: string }) {
  return (
    <PreviewErrorBoundary fallback={<div className="admin-variant__preview-state">לא ניתן להציג את המודל</div>}>
      <Canvas
        shadows
        camera={{ position: [2.1, 1.35, 2.5], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, toneMapping: ACESFilmicToneMapping }}
        onCreated={({ gl }) => { gl.toneMappingExposure = 0.82 }}
      >
        <color attach="background" args={['#cfd1cd']} />
        <ambientLight intensity={0.28} />
        <directionalLight position={[-3.5, 5, 4]} intensity={1.35} castShadow />
        <directionalLight position={[3, 2, 1]} intensity={0.22} />
        <Suspense fallback={null}>
          <Model url={url} />
          <Environment preset="studio" environmentIntensity={0.22} />
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#c3c6c1" roughness={0.95} />
        </mesh>
        <OrbitControls makeDefault target={[0, 0.65, 0]} enablePan={false} minDistance={1.5} maxDistance={4} />
      </Canvas>
    </PreviewErrorBoundary>
  )
}

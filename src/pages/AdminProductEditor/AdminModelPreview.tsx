import { Component, Suspense, useMemo, type ErrorInfo, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Edges, Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const normalized = useMemo(() => {
    const object = scene.clone(true)
    const box = new Box3().setFromObject(object)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const scale = 1.45 / Math.max(size.x, size.y, size.z, 0.001)
    object.position.set(-center.x, -box.min.y, -center.z)
    return { object, scale }
  }, [scene])

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
      <Canvas camera={{ position: [2.1, 1.35, 2.5], fov: 38 }} dpr={[1, 1.5]}>
        <color attach="background" args={['#f3f1eb']} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} />
        <Suspense fallback={null}>
          <Model url={url} />
          <Environment preset="studio" environmentIntensity={0.4} />
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#ddd8cf" />
          <Edges color="#d0cbc2" />
        </mesh>
        <OrbitControls makeDefault target={[0, 0.65, 0]} enablePan={false} minDistance={1.5} maxDistance={4} />
      </Canvas>
    </PreviewErrorBoundary>
  )
}

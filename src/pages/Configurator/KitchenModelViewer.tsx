import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, Environment, Html, OrbitControls, useGLTF } from '@react-three/drei'
import { configuratorModelUrl } from '../../assets/cloudinaryImages'

useGLTF.preload(configuratorModelUrl)

function KitchenModel() {
  const { scene } = useGLTF(configuratorModelUrl)
  return <primitive object={scene} />
}

function Loader() {
  return <Html center>טוען מודל תלת מימד...</Html>
}

export default function KitchenModelViewer() {
  return (
    <Canvas camera={{ position: [4, 3, 6], fov: 45 }} shadows>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <Suspense fallback={<Loader />}>
        <Bounds fit clip observe margin={1.2}>
          <Center>
            <KitchenModel />
          </Center>
        </Bounds>
        <Environment preset="apartment" />
      </Suspense>
      <OrbitControls makeDefault enablePan enableZoom enableRotate />
    </Canvas>
  )
}

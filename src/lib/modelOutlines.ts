import {
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  type Mesh,
  type Object3D,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const SKETCHUP_EDGE_COLOR = '#343530'
const SKETCHUP_EDGE_OPACITY = 0.68
const SKETCHUP_EDGE_THRESHOLD_DEGREES = 2.5
const SURFACE_OFFSET_SCALE = 1.001

export function addSketchUpModelOutlines(root: Object3D) {
  const edgeGeometries: EdgesGeometry[] = []
  const meshToRoot = new Matrix4()

  root.updateWorldMatrix(true, true)
  const rootWorldInverse = root.matrixWorld.clone().invert()

  root.traverse(node => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return

    const geometry = new EdgesGeometry(mesh.geometry, SKETCHUP_EDGE_THRESHOLD_DEGREES)
    if (geometry.attributes.position.count === 0) {
      geometry.dispose()
      return
    }

    meshToRoot.multiplyMatrices(rootWorldInverse, mesh.matrixWorld)
    geometry.applyMatrix4(meshToRoot)
    edgeGeometries.push(geometry)
  })

  if (edgeGeometries.length === 0) return () => undefined

  const mergedGeometry = mergeGeometries(edgeGeometries, false)
  edgeGeometries.forEach(geometry => geometry.dispose())
  if (!mergedGeometry) return () => undefined

  mergedGeometry.computeBoundingBox()
  const outlineCenter = mergedGeometry.boundingBox?.getCenter(new Vector3()) ?? new Vector3()
  mergedGeometry.translate(-outlineCenter.x, -outlineCenter.y, -outlineCenter.z)

  const outline = new LineSegments(
    mergedGeometry,
    new LineBasicMaterial({
      color: SKETCHUP_EDGE_COLOR,
      transparent: true,
      opacity: SKETCHUP_EDGE_OPACITY,
      depthTest: true,
      depthWrite: false,
      toneMapped: false,
    }),
  )

  // Pull the screen-space line a fraction above the source surface. This
  // avoids z-fighting on shallow SketchUp frames without exposing rear edges.
  outline.position.copy(outlineCenter)
  outline.scale.setScalar(SURFACE_OFFSET_SCALE)
  outline.renderOrder = 1
  root.add(outline)

  return () => {
    outline.removeFromParent()
    outline.geometry.dispose()
    if (Array.isArray(outline.material)) {
      outline.material.forEach(material => material.dispose())
    } else {
      outline.material.dispose()
    }
  }
}

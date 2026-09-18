import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Marker {
  city: string
  country: string
  latitude: number
  longitude: number
}

const markers: Marker[] = [
  { city: 'Tokyo', country: 'Japão', latitude: 35.68, longitude: 139.69 },
  { city: 'London', country: 'Reino Unido', latitude: 51.5, longitude: -0.12 },
  { city: 'Paris', country: 'França', latitude: 48.85, longitude: 2.35 },
  { city: 'Rio Grande', country: 'Brasil', latitude: -32.03, longitude: -52.1 },
  { city: 'São Paulo', country: 'Brasil', latitude: -23.55, longitude: -46.63 },
  { city: 'New York', country: 'Estados Unidos', latitude: 40.71, longitude: -74 },
]

function pointOnSphere(latitude: number, longitude: number, radius = 1.03) {
  const phi = (90 - latitude) * (Math.PI / 180)
  const theta = (longitude + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

export function InteractiveGlobe({ onSelectCity }: { onSelectCity: (city: string) => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const onSelectCityRef = useRef(onSelectCity)

  useEffect(() => {
    onSelectCityRef.current = onSelectCity
  }, [onSelectCity])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      host.classList.add('is-fallback')
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.z = 2.8
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.dataset.engine = 'three.js'
    renderer.domElement.setAttribute('aria-label', 'Planeta 3D interativo com destinos destacados')
    renderer.domElement.setAttribute('role', 'img')
    host.appendChild(renderer.domElement)

    const globe = new THREE.Group()
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x8bb7a1, roughness: 0.82, metalness: 0.05 }),
    )
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(1.006, 18, 12)),
      new THREE.LineBasicMaterial({ color: 0xdff7e8, transparent: true, opacity: 0.19 }),
    )
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xb4e9c5, transparent: true, opacity: 0.08, side: THREE.BackSide }),
    )
    globe.add(sphere, wire, atmosphere)

    const markerMeshes: THREE.Mesh[] = []
    for (const marker of markers) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xf4f2e9 }),
      )
      mesh.position.copy(pointOnSphere(marker.latitude, marker.longitude))
      mesh.userData = marker
      markerMeshes.push(mesh)
      globe.add(mesh)
    }
    scene.add(globe)

    const starGeometry = new THREE.BufferGeometry()
    const starPositions = new Float32Array(96 * 3)
    for (let index = 0; index < starPositions.length; index += 3) {
      starPositions[index] = (Math.random() - 0.5) * 6
      starPositions[index + 1] = (Math.random() - 0.5) * 4
      starPositions[index + 2] = -1.5 - Math.random() * 3
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xb4e9c5, size: 0.012, transparent: true, opacity: 0.45 })))

    scene.add(new THREE.AmbientLight(0x9dd4b0, 1.8))
    const keyLight = new THREE.DirectionalLight(0xf4f2e9, 3)
    keyLight.position.set(-2, 1.5, 3)
    scene.add(keyLight)

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      const size = Math.max(1, Math.min(width, height))
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(size, size, false)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let pointerDown = false
    let dragged = false
    let startX = 0
    let startY = 0
    const setPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
    const pointerStart = (event: PointerEvent) => {
      pointerDown = true
      dragged = false
      startX = event.clientX
      startY = event.clientY
      renderer.domElement.setPointerCapture(event.pointerId)
    }
    const pointerMove = (event: PointerEvent) => {
      if (!pointerDown) return
      const deltaX = event.clientX - startX
      const deltaY = event.clientY - startY
      if (Math.abs(deltaX) + Math.abs(deltaY) > 4) dragged = true
      globe.rotation.y += deltaX * 0.004
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + deltaY * 0.002, -0.65, 0.65)
      startX = event.clientX
      startY = event.clientY
    }
    const pointerEnd = (event: PointerEvent) => {
      if (!dragged) {
        setPointer(event)
        raycaster.setFromCamera(pointer, camera)
        const hit = raycaster.intersectObjects(markerMeshes)[0]?.object.userData as Marker | undefined
        if (hit) onSelectCityRef.current(hit.city)
      }
      pointerDown = false
      renderer.domElement.releasePointerCapture(event.pointerId)
    }
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.0015, 2.15, 3.6)
    }
    renderer.domElement.addEventListener('pointerdown', pointerStart)
    renderer.domElement.addEventListener('pointermove', pointerMove)
    renderer.domElement.addEventListener('pointerup', pointerEnd)
    renderer.domElement.addEventListener('wheel', wheel, { passive: false })

    let animationFrame = 0
    const animate = () => {
      if (document.visibilityState === 'visible') {
        if (!reducedMotion) globe.rotation.y += 0.0007
        renderer.render(scene, camera)
      }
      animationFrame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerdown', pointerStart)
      renderer.domElement.removeEventListener('pointermove', pointerMove)
      renderer.domElement.removeEventListener('pointerup', pointerEnd)
      renderer.domElement.removeEventListener('wheel', wheel)
      renderer.dispose()
      sphere.geometry.dispose()
      wire.geometry.dispose()
      atmosphere.geometry.dispose()
      starGeometry.dispose()
      host.replaceChildren()
    }
  }, [])

  return <div ref={hostRef} className="interactive-globe">
    <div className="globe-fallback" role="img" aria-label="Planeta ilustrado">
      <span>35° N</span><span>139° E</span>
    </div>
    <div className="globe-hint" aria-hidden="true">arraste para explorar · scroll para aproximar</div>
  </div>
}

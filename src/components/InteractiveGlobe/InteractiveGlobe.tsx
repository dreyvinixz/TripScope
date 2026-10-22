import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import rawWorldMap from '@svg-maps/world'

interface Marker {
  city: string
  country: string
  countryId: string
  latitude: number
  longitude: number
  label?: string
  /** Normalized position in the source SVG viewBox (u, v). */
  mapPosition?: [number, number]
  /** Small normalized adjustment for fine-tuning a marker on the map. */
  mapOffset?: [number, number]
}

interface WorldMapData {
  viewBox: string
  locations: Array<{ id: string; path: string }>
}

const worldMap = rawWorldMap as unknown as WorldMapData

const markers: Marker[] = [
  { city: 'Tokyo', country: 'Japão', countryId: 'jp', latitude: 35.68, longitude: 139.69, label: 'Tokyo', mapPosition: [0.866, 0.53], mapOffset: [-0.008, 0] },
  { city: 'London', country: 'Reino Unido', countryId: 'gb', latitude: 51.5, longitude: -0.12, label: 'London' },
  { city: 'São Paulo', country: 'Brasil', countryId: 'br', latitude: -9.55, longitude: -8.63, label: 'São Paulo', mapOffset: [-0.015, 0] },
  { city: 'New York', country: 'Estados Unidos', countryId: 'us', latitude: 41.5, longitude: -74, label: 'New York' },
]

const routeMarkers = markers.filter(marker => marker.label)
const labelOffsets: Record<string, [number, number]> = {
  London: [-18, -20],
  Paris: [24, -20],
}

// Geographic bounds for automatic placements. Tokyo uses a measured map
// position because the source projection is not linear in latitude.
const countryBounds: Record<string, { west: number; east: number; south: number; north: number }> = {
  gb: { west: -5.8, east: 1.8, south: 49.9, north: 58.7 },
  fr: { west: -4.8, east: 8.2, south: 42.3, north: 51.1 },
  br: { west: -74, east: -34.8, south: -33.8, north: 5.3 },
  us: { west: -124.7, east: -66.9, south: 24.4, north: 49.4 },
}

interface MapBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

function pointOnMap(u: number, v: number, radius = 1.03) {
  const phi = u * Math.PI * 2
  const theta = v * Math.PI
  return new THREE.Vector3(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

export function InteractiveGlobe({ onSelectCity }: { onSelectCity: (city: string) => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const cityLabelRefs = useRef(new Map<string, HTMLDivElement>())
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
    camera.position.z = 4.4
    renderer.setPixelRatio(Math.max(1.5, Math.min(window.devicePixelRatio, 2)))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.dataset.engine = 'three.js'
    renderer.domElement.setAttribute('aria-label', 'Planeta 3D interativo com destinos destacados')
    renderer.domElement.setAttribute('role', 'img')
    host.appendChild(renderer.domElement)

    const globe = new THREE.Group()
    const [viewX, viewY, viewWidth, viewHeight] = worldMap.viewBox.split(' ').map(Number)
    const mapCanvas = document.createElement('canvas')
    mapCanvas.width = 3030
    mapCanvas.height = 1998
    const mapContext = mapCanvas.getContext('2d')
    if (mapContext) {
      mapContext.fillStyle = '#080808'
      mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height)
      mapContext.setTransform(mapCanvas.width / viewWidth, 0, 0, mapCanvas.height / viewHeight, -viewX * mapCanvas.width / viewWidth, -viewY * mapCanvas.height / viewHeight)
      mapContext.fillStyle = '#ffffff'
      for (const location of worldMap.locations) mapContext.fill(new Path2D(location.path))

      const landPixels = mapContext.getImageData(0, 0, mapCanvas.width, mapCanvas.height)
      const outlinePixels = mapContext.createImageData(mapCanvas.width, mapCanvas.height)
      const isLand = (x: number, y: number) => landPixels.data[(y * mapCanvas.width + x) * 4] > 12
      const outlineRadius = 3
      for (let y = outlineRadius; y < mapCanvas.height - outlineRadius; y += 1) {
        for (let x = outlineRadius; x < mapCanvas.width - outlineRadius; x += 1) {
          const sourcePixel = (y * mapCanvas.width + x) * 4
          const coverage = landPixels.data[sourcePixel]
          if (coverage <= 12) continue
          const isCoast = !isLand(x - outlineRadius, y)
            || !isLand(x + outlineRadius, y)
            || !isLand(x, y - outlineRadius)
            || !isLand(x, y + outlineRadius)
          if (!isCoast) continue
          const pixel = (y * mapCanvas.width + x) * 4
          outlinePixels.data[pixel] = 145
          outlinePixels.data[pixel + 1] = 145
          outlinePixels.data[pixel + 2] = 140
          outlinePixels.data[pixel + 3] = Math.round(160 * coverage / 255)
        }
      }
      mapContext.setTransform(1, 0, 0, 1, 0, 0)
      mapContext.putImageData(outlinePixels, 0, 0)
    }
    const geographyTexture = new THREE.CanvasTexture(mapCanvas)
    geographyTexture.colorSpace = THREE.SRGBColorSpace
    geographyTexture.minFilter = THREE.LinearMipmapLinearFilter
    geographyTexture.magFilter = THREE.LinearFilter
    geographyTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())

    const mapAnchors = new Map<string, MapBounds>()
    const anchorCanvas = document.createElement('canvas')
    anchorCanvas.width = viewWidth
    anchorCanvas.height = viewHeight
    const anchorContext = anchorCanvas.getContext('2d')
    if (anchorContext) {
      const pixelCount = anchorCanvas.width * anchorCanvas.height
      for (const marker of routeMarkers) {
        if (mapAnchors.has(marker.countryId)) continue
        const location = worldMap.locations.find(country => country.id === marker.countryId)
        if (!location) continue
        anchorContext.clearRect(0, 0, anchorCanvas.width, anchorCanvas.height)
        anchorContext.fillStyle = '#ffffff'
        anchorContext.fill(new Path2D(location.path))
        const pixels = anchorContext.getImageData(0, 0, anchorCanvas.width, anchorCanvas.height).data
        const visited = new Uint8Array(pixelCount)
        const queue = new Int32Array(pixelCount)
        let countryMinX = anchorCanvas.width
        let countryMaxX = 0
        let countryMinY = anchorCanvas.height
        let countryMaxY = 0
        let largestCount = 0
        let largestMinX = 0
        let largestMaxX = 0
        let largestMinY = 0
        let largestMaxY = 0
        for (let start = 0; start < pixelCount; start += 1) {
          if (visited[start] || pixels[start * 4] <= 128) continue
          let head = 0
          let tail = 0
          let count = 0
          let minX = anchorCanvas.width
          let maxX = 0
          let minY = anchorCanvas.height
          let maxY = 0
          visited[start] = 1
          queue[tail++] = start
          while (head < tail) {
            const pixelIndex = queue[head++]
            const x = pixelIndex % anchorCanvas.width
            const y = Math.floor(pixelIndex / anchorCanvas.width)
            count += 1
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
            countryMinX = Math.min(countryMinX, x)
            countryMaxX = Math.max(countryMaxX, x)
            countryMinY = Math.min(countryMinY, y)
            countryMaxY = Math.max(countryMaxY, y)
            const neighbors = [pixelIndex - 1, pixelIndex + 1, pixelIndex - anchorCanvas.width, pixelIndex + anchorCanvas.width]
            for (const neighbor of neighbors) {
              if (neighbor < 0 || neighbor >= pixelCount || visited[neighbor] || pixels[neighbor * 4] <= 128) continue
              if ((neighbor === pixelIndex - 1 && x === 0) || (neighbor === pixelIndex + 1 && x === anchorCanvas.width - 1)) continue
              visited[neighbor] = 1
              queue[tail++] = neighbor
            }
          }
          if (count > largestCount) {
            largestCount = count
            largestMinX = minX
            largestMaxX = maxX
            largestMinY = minY
            largestMaxY = maxY
          }
        }
        if (largestCount > 0) {
          const isArchipelago = marker.countryId === 'jp'
          mapAnchors.set(marker.countryId, {
            minX: (isArchipelago ? countryMinX : largestMinX) / anchorCanvas.width,
            maxX: (isArchipelago ? countryMaxX : largestMaxX) / anchorCanvas.width,
            minY: (isArchipelago ? countryMinY : largestMinY) / anchorCanvas.height,
            maxY: (isArchipelago ? countryMaxY : largestMaxY) / anchorCanvas.height,
          })
        }
      }
    }
    const getMarkerAnchor = (marker: Marker) => {
      let anchor: THREE.Vector2
      if (marker.mapPosition) {
        anchor = new THREE.Vector2(...marker.mapPosition)
      } else {
        const landBounds = mapAnchors.get(marker.countryId)
        const geoBounds = countryBounds[marker.countryId]
        if (!landBounds || !geoBounds) return undefined
        const xRatio = THREE.MathUtils.clamp((marker.longitude - geoBounds.west) / (geoBounds.east - geoBounds.west), 0, 1)
        const yRatio = THREE.MathUtils.clamp((geoBounds.north - marker.latitude) / (geoBounds.north - geoBounds.south), 0, 1)
        anchor = new THREE.Vector2(
          THREE.MathUtils.lerp(landBounds.minX, landBounds.maxX, xRatio),
          THREE.MathUtils.lerp(landBounds.minY, landBounds.maxY, yRatio),
        )
      }
      if (marker.mapOffset) anchor.add(new THREE.Vector2(...marker.mapOffset))
      return anchor
    }
    const globeMaterial = new THREE.MeshBasicMaterial({ map: geographyTexture })
    const sphereGeometry = new THREE.SphereGeometry(1, 96, 64)
    const sphere = new THREE.Mesh(sphereGeometry, globeMaterial)
    globe.add(sphere)
    globe.rotation.y = -2.05
    globe.rotation.x = 0.17

    const markerMeshes: THREE.Mesh[] = []
    for (const marker of markers) {
      const isFeatured = Boolean(marker.label)
      const markerSize = 0.046
      const mesh = new THREE.Mesh(
        isFeatured ? new THREE.BoxGeometry(markerSize, markerSize, 0.024) : new THREE.SphereGeometry(0.012, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff6500, transparent: !isFeatured, opacity: isFeatured ? 1 : 0, depthWrite: isFeatured }),
      )
      const anchor = getMarkerAnchor(marker)
      if (!anchor) continue
      const position = pointOnMap(anchor.x, anchor.y, 1.018)
      mesh.position.copy(position)
      if (isFeatured) mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize())
      mesh.userData = marker
      markerMeshes.push(mesh)
      globe.add(mesh)
    }

    const routeLines: THREE.Line[] = []
    for (let index = 0; index < routeMarkers.length; index += 1) {
      const from = routeMarkers[index]
      const to = routeMarkers[(index + 1) % routeMarkers.length]
      const fromAnchor = getMarkerAnchor(from)
      const toAnchor = getMarkerAnchor(to)
      if (!fromAnchor || !toAnchor) continue
      const routeStart = pointOnMap(fromAnchor.x, fromAnchor.y, 1)
      const routeEnd = pointOnMap(toAnchor.x, toAnchor.y, 1)
      const angle = routeStart.angleTo(routeEnd)
      const routePoints = Array.from({ length: 81 }, (_, pointIndex) => {
        const progress = pointIndex / 80
        const direction = routeStart.clone().lerp(routeEnd, progress).normalize()
        const arcHeight = 0.11 + angle * 0.015
        return direction.multiplyScalar(1.025 + arcHeight * Math.sin(Math.PI * progress))
      })
      const routeGeometry = new THREE.BufferGeometry().setFromPoints(routePoints)
      const routeLine = new THREE.Line(routeGeometry, new THREE.LineBasicMaterial({ color: 0xff6500, transparent: true, opacity: 0.9 }))
      routeLines.push(routeLine)
      globe.add(routeLine)
    }
    scene.add(globe)

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(Math.max(width, 1), Math.max(height, 1), false)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

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
      if (!event.ctrlKey) return
      event.preventDefault()
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.0015, 2.6, 4.4)
    }
    renderer.domElement.addEventListener('pointerdown', pointerStart)
    renderer.domElement.addEventListener('pointermove', pointerMove)
    renderer.domElement.addEventListener('pointerup', pointerEnd)
    renderer.domElement.addEventListener('wheel', wheel, { passive: false })

    let animationFrame = 0
    const animate = () => {
      if (document.visibilityState === 'visible') {
        globe.rotation.y += 0.001
        renderer.render(scene, camera)
        for (const marker of routeMarkers) {
          const label = cityLabelRefs.current.get(marker.city)
          if (!label) continue
          const anchor = getMarkerAnchor(marker)
          if (!anchor) continue
          const position = pointOnMap(anchor.x, anchor.y, 1.045)
          position.applyEuler(globe.rotation)
          const visible = position.z > 0.1
          if (visible) {
            position.project(camera)
            const [offsetX, offsetY] = labelOffsets[marker.city] ?? [0, -18]
            label.style.left = `${THREE.MathUtils.clamp((position.x * 0.5 + 0.5) * host.clientWidth + offsetX, 28, host.clientWidth - 28)}px`
            label.style.top = `${THREE.MathUtils.clamp((-position.y * 0.5 + 0.5) * host.clientHeight + offsetY, 20, host.clientHeight - 12)}px`
          }
          label.style.opacity = visible ? '1' : '0'
        }
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
      globeMaterial.dispose()
      geographyTexture.dispose()
      sphere.geometry.dispose()
      for (const routeLine of routeLines) {
        routeLine.geometry.dispose()
        if (Array.isArray(routeLine.material)) routeLine.material.forEach(material => material.dispose())
        else routeLine.material.dispose()
      }
      for (const marker of markerMeshes) {
        marker.geometry.dispose()
        if (Array.isArray(marker.material)) marker.material.forEach(material => material.dispose())
        else marker.material.dispose()
      }
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={hostRef} className="interactive-globe">
    <div className="globe-fallback" role="img" aria-label="Planeta ilustrado">
      <span>35° N</span><span>139° E</span>
    </div>
    {routeMarkers.map(marker => <div
      key={marker.city}
      ref={element => {
        if (element) cityLabelRefs.current.set(marker.city, element)
        else cityLabelRefs.current.delete(marker.city)
      }}
      className="globe-city-label"
      aria-hidden="true"
    >{marker.label}</div>)}
  </div>
}

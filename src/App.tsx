import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, Stars, useGLTF, Text } from '@react-three/drei'
import React, { useRef, useState, useEffect, useMemo } from 'react'
import type { Group } from 'three'
import * as THREE from 'three'
import './App.css'

// Helper function to create a rounded rectangle shape
function createRoundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2
  
  shape.moveTo(x + radius, y)
  shape.lineTo(x + width - radius, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + radius)
  shape.lineTo(x + width, y + height - radius)
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  shape.lineTo(x + radius, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)
  
  return shape
}

function HoverPill({ 
  text, 
  objectRef, 
  isHovered, 
  isSelected,
  distance = 5,
  onHoverEnd 
}: { 
  text: string
  objectRef: React.RefObject<Group | null>
  isHovered: boolean
  isSelected: boolean
  distance?: number
  onHoverEnd: () => void
}) {
  const pillRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const opacityRef = useRef(0)
  const timeoutRef = useRef<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const wasVisible = useRef(false)
  
  // Estimate text width based on character count (monospaced font)
  const textWidth = useMemo(() => text.length * 0.6, [text])
  const pillWidth = textWidth + 0.6 // Reduced padding
  const pillHeight = 1.2
  const pillRadius = 0.6
  
  // Create pill geometry
  const pillGeometry = useMemo(() => {
    const shape = createRoundedRectShape(pillWidth, pillHeight, pillRadius)
    const geometry = new THREE.ShapeGeometry(shape)
    return geometry
  }, [pillWidth, pillHeight, pillRadius])

  useEffect(() => {
    if (isSelected) {
      setIsVisible(false)
      wasVisible.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    if (isHovered) {
      // Clear any pending hide timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      // Only reset opacity if we're not already visible
      if (!wasVisible.current) {
        opacityRef.current = 0
      }
      
      setIsVisible(true)
      wasVisible.current = true
    } else if (wasVisible.current) {
      // Only start fade-out timer if we were visible
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false)
        wasVisible.current = false
        onHoverEnd()
      }, 3000)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isHovered, isSelected, onHoverEnd])

  useFrame((_, delta) => {
    if (!pillRef.current || !objectRef.current || !isVisible || isSelected) return

    // Make pill always face the camera (billboard effect)
    pillRef.current.lookAt(camera.position)

    // Get object world position
    const objectPos = new THREE.Vector3()
    objectRef.current.getWorldPosition(objectPos)
    
    // Calculate direction from Earth (origin) to object
    const direction = objectPos.clone().normalize()
    
    // Fade in/out animation
    if (isHovered) {
      opacityRef.current = Math.min(opacityRef.current + delta * 3, 1)
    } else {
      // Fade out after hover ends
      opacityRef.current = Math.max(opacityRef.current - delta * 0.5, 0)
      if (opacityRef.current <= 0) {
        setIsVisible(false)
      }
    }

    // Position pill on opposite side of Earth from object
    // Line: Earth (0,0,0) -> Object -> Pill
    const pillPosition = objectPos.clone().add(direction.multiplyScalar(distance))
    pillRef.current.position.copy(pillPosition)

    // Update pill and text opacity
    pillRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material
        if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
          material.opacity = opacityRef.current
          material.transparent = true
        } else if (Array.isArray(material)) {
          // Handle multi-material case
          material.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
              mat.opacity = opacityRef.current
              mat.transparent = true
            }
          })
        }
      }
    })
  })

  if (!isVisible || isSelected) {
    return null
  }

  return (
    <group ref={pillRef}>
      {/* Pill background */}
      <mesh geometry={pillGeometry} renderOrder={999}>
        <meshStandardMaterial 
          color="#000000" 
          opacity={0.7} 
          transparent 
          depthWrite={false}
        />
      </mesh>
      {/* Text */}
      <Text
        fontSize={1.0}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
        renderOrder={1000}
        position={[0, 0, 0.01]} // Slightly in front of pill
        font="/fonts/JetBrainsMono-Regular.ttf"
        characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>? "
      >
        {text}
      </Text>
    </group>
  )
}

function Earth({ onClick }: { onClick: () => void }) {
  const { scene } = useGLTF('/models/scene.glb')
  const groupRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.15
  })

  return (
    <group ref={groupRef} onClick={onClick}>
      <primitive object={scene} />
    </group>
  )
}

function Satellite({ onClick, orbitRef, isSelected }: { onClick: () => void, orbitRef: React.RefObject<Group | null>, isSelected: boolean }) {
  const { scene } = useGLTF('/models/low_poly_satellite.glb')
  const satelliteGroupRef = useRef<Group>(null)
  const [isHovered, setIsHovered] = useState(false)
  const angleRef = useRef(Math.PI / 4) // Start at 45 degrees (in radians)
  const orbitRadius = 15
  const orbitSpeed = 0.3
  const satelliteScale = 0.2
  const orbitTiltX = 2 // Tilt orbit plane around X axis (in radians)

  useFrame((_, delta) => {
    if (!orbitRef.current || !satelliteGroupRef.current) return
    angleRef.current += delta * orbitSpeed
    
    // Calculate circular orbit position
    const x = Math.cos(angleRef.current) * orbitRadius
    const z = Math.sin(angleRef.current) * orbitRadius
    
    // Apply orbital plane tilt
    orbitRef.current.position.x = x
    orbitRef.current.position.y = Math.sin(orbitTiltX) * z
    orbitRef.current.position.z = Math.cos(orbitTiltX) * z
    
    // Rotate the satellite itself
    satelliteGroupRef.current.rotation.y += delta * 0.5
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick()
  }

  const handlePointerOver = (e: any) => {
    if (isSelected) return // Disable hover when selected
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    setIsHovered(true)
  }

  const handlePointerOut = () => {
    if (isSelected) return // Disable hover when selected
    document.body.style.cursor = 'auto'
    setIsHovered(false)
  }

  // Reset hover state when selected
  useEffect(() => {
    if (isSelected) {
      setIsHovered(false)
    }
  }, [isSelected])

  return (
    <>
      <group ref={orbitRef} onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <group ref={satelliteGroupRef} scale={satelliteScale}>
          <primitive object={scene} />
        </group>
      </group>
      <HoverPill 
        text="Syngery Interview" 
        objectRef={orbitRef} 
        isHovered={isHovered}
        isSelected={isSelected}
        distance={5}
        onHoverEnd={() => setIsHovered(false)}
      />
    </>
  )
}

function SpaceShuttle({ onClick, orbitRef, isSelected }: { onClick: () => void, orbitRef: React.RefObject<Group | null>, isSelected: boolean }) {
  const { scene } = useGLTF('/models/low-poly_space_shuttle.glb')
  const shuttleGroupRef = useRef<Group>(null)
  const [isHovered, setIsHovered] = useState(false)
  const angleRef = useRef(0) // Start at 0 degrees (in radians)
  const orbitRadius = 10 // Different radius than satellite
  const orbitSpeed = 0.2 // Slower orbit speed
  const shuttleScale = 0.002
  const orbitTiltX = -1.5 // Different tilt angle
  const targetQuaternion = useRef(new THREE.Quaternion())

  useFrame((_, delta) => {
    if (!orbitRef.current || !shuttleGroupRef.current) return
    angleRef.current += delta * orbitSpeed
    
    // Calculate circular orbit position
    const x = Math.cos(angleRef.current) * orbitRadius
    const z = Math.sin(angleRef.current) * orbitRadius
    
    // Apply orbital plane tilt
    orbitRef.current.position.x = x
    orbitRef.current.position.y = Math.sin(orbitTiltX) * z
    orbitRef.current.position.z = Math.cos(orbitTiltX) * z
    
    // Make shuttle's bottom face Earth (center) - smooth rotation using quaternions
    const shuttlePos = orbitRef.current.position.clone()
    const directionToEarth = new THREE.Vector3(0, 0, 0).sub(shuttlePos).normalize()
    
    // Calculate right vector (tangent to orbit, pointing in direction of motion)
    // This gives us a stable reference frame that follows the orbit
    const orbitDirection = new THREE.Vector3(-Math.sin(angleRef.current), 0, Math.cos(angleRef.current))
    const tiltedOrbitDirection = new THREE.Vector3(
      orbitDirection.x,
      Math.sin(orbitTiltX) * orbitDirection.z,
      Math.cos(orbitTiltX) * orbitDirection.z
    ).normalize()
    
    // Right vector is perpendicular to both direction to Earth and orbit direction
    const right = new THREE.Vector3().crossVectors(tiltedOrbitDirection, directionToEarth).normalize()
    
    // If right is too small (near poles), use a fallback
    if (right.length() < 0.1) {
      right.crossVectors(new THREE.Vector3(1, 0, 0), directionToEarth).normalize()
    }
    
    // Create rotation matrix where -Y (bottom) points at Earth
    const bottom = directionToEarth.clone().negate()
    const forward = new THREE.Vector3().crossVectors(right, bottom).normalize()
    
    const matrix = new THREE.Matrix4()
    matrix.makeBasis(right, bottom, forward)
    targetQuaternion.current.setFromRotationMatrix(matrix)
    
    // Smoothly interpolate to target rotation to avoid sudden flips
    shuttleGroupRef.current.quaternion.slerp(targetQuaternion.current, 0.15)
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick()
  }

  const handlePointerOver = (e: any) => {
    if (isSelected) return // Disable hover when selected
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    setIsHovered(true)
  }

  const handlePointerOut = () => {
    if (isSelected) return // Disable hover when selected
    document.body.style.cursor = 'auto'
    setIsHovered(false)
  }

  // Reset hover state when selected
  useEffect(() => {
    if (isSelected) {
      setIsHovered(false)
    }
  }, [isSelected])

  return (
    <>
      <group ref={orbitRef} onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <group ref={shuttleGroupRef} scale={shuttleScale}>
          <primitive object={scene} />
        </group>
      </group>
      <HoverPill 
        text="Filesift" 
        objectRef={orbitRef} 
        isHovered={isHovered}
        isSelected={isSelected}
        distance={3}
        onHoverEnd={() => setIsHovered(false)}
      />
    </>
  )
}

function CameraController({ targetRef, isFollowing, controlsRef }: { targetRef: React.RefObject<Group | null> | null, isFollowing: boolean, controlsRef: React.RefObject<any> }) {
  const { camera } = useThree()
  const targetPosition = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3())
  const isTransitioning = useRef(false)
  const transitionProgress = useRef(0)
  const startPosition = useRef(new THREE.Vector3())
  const wasFollowing = useRef(false)
  const isTransitioningToCenter = useRef(false)
  const centerTransitionProgress = useRef(0)
  const startTargetPosition = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    // Detect when we STOP following
    if (wasFollowing.current && !isFollowing) {
      // Start smooth transition of controls target back to Earth (center)
      if (controlsRef.current) {
        isTransitioningToCenter.current = true
        centerTransitionProgress.current = 0
        startTargetPosition.current.copy(controlsRef.current.target)
      }
      isTransitioning.current = false
      transitionProgress.current = 0
    }
    wasFollowing.current = isFollowing

    // Smooth transition of controls target to center when deselecting
    if (isTransitioningToCenter.current && controlsRef.current) {
      centerTransitionProgress.current = Math.min(centerTransitionProgress.current + delta * 0.6, 1)
      const t = centerTransitionProgress.current
      const smoothT = t * t * (3 - 2 * t) // Smoothstep interpolation
      
      // Lerp controls target from start position to center
      controlsRef.current.target.lerpVectors(startTargetPosition.current, new THREE.Vector3(0, 0, 0), smoothT)
      controlsRef.current.update()
      
      if (centerTransitionProgress.current >= 1) {
        isTransitioningToCenter.current = false
      }
    }

    if (controlsRef.current) {
      controlsRef.current.enabled = !isFollowing
    }

    if (!targetRef?.current || !isFollowing) {
      return
    }
  
    const targetPos = targetRef.current.position
    const distance = 12
  
    // Calculate direction from Earth (center) to object
    const directionFromEarth = targetPos.clone().normalize()
  
    // Position camera behind the object (relative to Earth)
    targetPosition.current.copy(targetPos).add(directionFromEarth.clone().multiplyScalar(distance))
  
    // Calculate what the camera's orientation WILL be when looking at the object
    // This gives us stable right/up vectors that don't depend on current camera state
    const targetForward = targetPos.clone().sub(targetPosition.current).normalize()
    
    // Use a consistent world up, but handle the pole case
    let worldUp = new THREE.Vector3(0, 1, 0)
    const dot = Math.abs(targetForward.dot(worldUp))
    if (dot > 0.9) {
      // Smoothly blend to alternate up vector to avoid sudden switches
      const altUp = new THREE.Vector3(0, 0, 1)
      const blend = (dot - 0.9) / 0.1 // 0 at dot=0.9, 1 at dot=1.0
      worldUp.lerp(altUp, blend)
    }
  
    const targetRight = new THREE.Vector3().crossVectors(targetForward, worldUp).normalize()
    const targetUp = new THREE.Vector3().crossVectors(targetRight, targetForward).normalize()
  
    // Offset the look-at target using the TARGET orientation (not current)
    const lookAtOffset = targetRight.clone().multiplyScalar(3).add(targetUp.clone().multiplyScalar(2))
    targetLookAt.current.copy(targetPos).add(lookAtOffset)
  
    if (!isTransitioning.current) {
      isTransitioning.current = true
      transitionProgress.current = 0
      startPosition.current.copy(camera.position)
    }

    // Smooth transition
    transitionProgress.current = Math.min(transitionProgress.current + delta * 0.6, 1)
    const t = transitionProgress.current
    const smoothT = t * t * (3 - 2 * t) // Smoothstep interpolation

    // Lerp camera position from start to target
    camera.position.lerpVectors(startPosition.current, targetPosition.current, smoothT)
    
    // Make camera look at target
    camera.lookAt(targetLookAt.current)
    
    // Update controls target
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, smoothT)
      controlsRef.current.update()
    }
  })

  return null
}

function App() {
  const [selectedObject, setSelectedObject] = useState<'satellite' | 'shuttle' | null>(null)
  const satelliteRef = useRef<Group>(null)
  const shuttleRef = useRef<Group>(null)
  const controlsRef = useRef<any>(null)

  const handleSatelliteClick = () => {
    // Toggle selection - if already selected, deselect
    setSelectedObject(selectedObject === 'satellite' ? null : 'satellite')
  }

  const handleShuttleClick = () => {
    // Toggle selection - if already selected, deselect
    setSelectedObject(selectedObject === 'shuttle' ? null : 'shuttle')
  }

  const handleEarthClick = () => {
    // Clicking Earth deselects any selected object
    setSelectedObject(null)
  }

  const handleControlsStart = () => {
    // If user manually controls camera, stop following
    if (selectedObject) {
      setSelectedObject(null)
    }
  }

  const handleCanvasClick = (e: any) => {
    // Clicking on empty space (not on an object) deselects
    if (e.target === e.currentTarget) {
      setSelectedObject(null)
    }
  }

  const targetRef = selectedObject === 'satellite' ? satelliteRef : selectedObject === 'shuttle' ? shuttleRef : null

  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 50], fov: 50 }} gl={{ toneMappingExposure: 0.5 }} onClick={handleCanvasClick}>
        <Stars radius={300} depth={60} count={5000} factor={13} saturation={0} fade speed={0} />
        <Environment preset="studio" background={false} />
        <Earth onClick={handleEarthClick} />
        <Satellite 
          onClick={handleSatelliteClick} 
          orbitRef={satelliteRef} 
          isSelected={selectedObject === 'satellite'}
        />
        <SpaceShuttle 
          onClick={handleShuttleClick} 
          orbitRef={shuttleRef} 
          isSelected={selectedObject === 'shuttle'}
        />
        <OrbitControls 
          ref={controlsRef}
          enableZoom={true} 
          enablePan={true} 
          enableRotate={true}
          onStart={handleControlsStart}
        />
        <CameraController targetRef={targetRef} isFollowing={!!selectedObject} controlsRef={controlsRef} />
      </Canvas>
      <div className="overlay">
        <div className="overlay-top-left">
          <h1 className="name">Roshun Sunder</h1>
          <p className="overlay-prompt">Click something to learn about it...</p>
        </div>
        <div className="overlay-bottom-left">
          <a 
            href="https://www.linkedin.com/in/roshun-sunder" 
            target="_blank" 
            rel="noopener noreferrer"
            className="icon-link"
            aria-label="LinkedIn"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a 
            href="https://github.com/roshun-sunder" 
            target="_blank" 
            rel="noopener noreferrer"
            className="icon-link"
            aria-label="GitHub"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

export default App

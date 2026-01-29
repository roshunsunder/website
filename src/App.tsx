import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, Stars, useGLTF } from '@react-three/drei'
import React, { useRef, useState } from 'react'
import type { Group } from 'three'
import * as THREE from 'three'
import './App.css'

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

function Satellite({ onClick, orbitRef }: { onClick: () => void, orbitRef: React.RefObject<Group | null> }) {
  const { scene } = useGLTF('/models/low_poly_satellite.glb')
  const satelliteGroupRef = useRef<Group>(null)
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

  return (
    <group ref={orbitRef} onClick={handleClick} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'auto' }}>
      <group ref={satelliteGroupRef} scale={satelliteScale}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

function SpaceShuttle({ onClick, orbitRef }: { onClick: () => void, orbitRef: React.RefObject<Group | null> }) {
  const { scene } = useGLTF('/models/low-poly_space_shuttle.glb')
  const shuttleGroupRef = useRef<Group>(null)
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

  return (
    <group ref={orbitRef} onClick={handleClick} onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'auto' }}>
      <group ref={shuttleGroupRef} scale={shuttleScale}>
        <primitive object={scene} />
      </group>
    </group>
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
      <Canvas camera={{ position: [0, 0, 75], fov: 50 }} gl={{ toneMappingExposure: 0.5 }} onClick={handleCanvasClick}>
        <Stars radius={300} depth={60} count={5000} factor={13} saturation={0} fade speed={0} />
        <Environment preset="studio" background={false} />
        <Earth onClick={handleEarthClick} />
        <Satellite onClick={handleSatelliteClick} orbitRef={satelliteRef} />
        <SpaceShuttle onClick={handleShuttleClick} orbitRef={shuttleRef} />
        <OrbitControls 
          ref={controlsRef}
          enableZoom={true} 
          enablePan={true} 
          enableRotate={true}
          onStart={handleControlsStart}
        />
        <CameraController targetRef={targetRef} isFollowing={!!selectedObject} controlsRef={controlsRef} />
      </Canvas>
    </div>
  )
}

export default App

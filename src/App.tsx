import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls, Stars, useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import type { Group } from 'three'
import * as THREE from 'three'
import './App.css'

function Earth() {
  const { scene } = useGLTF('/models/scene.glb')
  const groupRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.15
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

function Satellite() {
  const { scene } = useGLTF('/models/low_poly_satellite.glb')
  const orbitGroupRef = useRef<Group>(null)
  const satelliteGroupRef = useRef<Group>(null)
  const angleRef = useRef(Math.PI / 4) // Start at 45 degrees (in radians)
  const orbitRadius = 15
  const orbitSpeed = 0.3
  const satelliteScale = 0.2
  const orbitTiltX = 2 // Tilt orbit plane around X axis (in radians)

  useFrame((_, delta) => {
    if (!orbitGroupRef.current || !satelliteGroupRef.current) return
    angleRef.current += delta * orbitSpeed
    
    // Calculate circular orbit position
    const x = Math.cos(angleRef.current) * orbitRadius
    const z = Math.sin(angleRef.current) * orbitRadius
    
    // Apply orbital plane tilt
    orbitGroupRef.current.position.x = x
    orbitGroupRef.current.position.y = Math.sin(orbitTiltX) * z
    orbitGroupRef.current.position.z = Math.cos(orbitTiltX) * z
    
    // Rotate the satellite itself
    satelliteGroupRef.current.rotation.y += delta * 0.5
  })

  return (
    <group ref={orbitGroupRef}>
      <group ref={satelliteGroupRef} scale={satelliteScale}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

function SpaceShuttle() {
  const { scene } = useGLTF('/models/low-poly_space_shuttle.glb')
  const orbitGroupRef = useRef<Group>(null)
  const shuttleGroupRef = useRef<Group>(null)
  const angleRef = useRef(0) // Start at 0 degrees (in radians)
  const orbitRadius = 10 // Different radius than satellite
  const orbitSpeed = 0.2 // Slower orbit speed
  const shuttleScale = 0.002
  const orbitTiltX = -1.5 // Different tilt angle
  const targetQuaternion = useRef(new THREE.Quaternion())

  useFrame((_, delta) => {
    if (!orbitGroupRef.current || !shuttleGroupRef.current) return
    angleRef.current += delta * orbitSpeed
    
    // Calculate circular orbit position
    const x = Math.cos(angleRef.current) * orbitRadius
    const z = Math.sin(angleRef.current) * orbitRadius
    
    // Apply orbital plane tilt
    orbitGroupRef.current.position.x = x
    orbitGroupRef.current.position.y = Math.sin(orbitTiltX) * z
    orbitGroupRef.current.position.z = Math.cos(orbitTiltX) * z
    
    // Make shuttle's bottom face Earth (center) - smooth rotation using quaternions
    const shuttlePos = orbitGroupRef.current.position.clone()
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

  return (
    <group ref={orbitGroupRef}>
      <group ref={shuttleGroupRef} scale={shuttleScale}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

function App() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 75], fov: 50 }} gl={{ toneMappingExposure: 0.5 }}>
        <Stars radius={300} depth={60} count={5000} factor={13} saturation={0} fade speed={0} />
        <Environment preset="studio" background={false} />
        <Earth />
        <Satellite />
        <SpaceShuttle />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}

export default App

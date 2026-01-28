import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls, Stars, useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import type { Group } from 'three'
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

function App() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 75], fov: 50 }} gl={{ toneMappingExposure: 0.5 }}>
        <Stars radius={300} depth={60} count={5000} factor={13} saturation={0} fade speed={0} />
        <Environment preset="studio" background={false} />
        <Earth />
        <Satellite />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}

export default App

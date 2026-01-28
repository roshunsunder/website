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
  const groupRef = useRef<Group>(null)
  const angleRef = useRef(0)
  const orbitRadius = 15
  const orbitSpeed = 0.3
  const satelliteScale = 0.2

  useFrame((_, delta) => {
    if (!groupRef.current) return
    angleRef.current += delta * orbitSpeed
    
    // Calculate circular orbit position
    groupRef.current.position.x = Math.cos(angleRef.current) * orbitRadius
    groupRef.current.position.z = Math.sin(angleRef.current) * orbitRadius
    groupRef.current.position.y = 0
    
    // Optionally rotate the satellite itself
    groupRef.current.rotation.y += delta * 0.5
  })

  return (
    <group ref={groupRef} scale={satelliteScale}>
      <primitive object={scene} />
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

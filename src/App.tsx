import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, Stars, useGLTF } from '@react-three/drei'
import './App.css'

function Earth() {
  const { scene } = useGLTF('/models/scene.glb')
  return <primitive object={scene} />
}

function App() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 75], fov: 50 }} gl={{ toneMappingExposure: 0.5 }}>
        <Stars radius={300} depth={60} count={5000} factor={4} saturation={0} fade speed={0} />
        <Environment preset="studio" background={false} />
        <Earth />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}

export default App

import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useGLTF } from '@react-three/drei'
import './App.css'

function Earth() {
  const { scene } = useGLTF('/models/scene.glb')
  return <primitive object={scene} />
}

function App() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 75], fov: 50 }} gl={{ toneMappingExposure: 0.5 }}>
        <Environment preset="studio" background={false} />
        <Earth />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}

export default App

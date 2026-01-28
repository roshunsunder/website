import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei'
import './App.css'

function Earth() {
  const { scene } = useGLTF('/models/scene.glb')
  return <primitive object={scene} />
}

function App() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 75], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={4} />
        <Earth />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}

export default App

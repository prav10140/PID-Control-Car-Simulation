import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Car_Motion.css';

// --- CUSTOM SVG GRAPH ---
const TelemetryGraph = ({ data, maxPoints }) => {
  if (!data || data.length === 0) return <div style={{color: '#9ca3af', fontSize: '12px'}}>AWAITING TELEMETRY...</div>;

  const width = 1000; 
  const height = 250; 
  const padX = 40;
  const padY = 20;

  const mapX = (index) => padX + (index / (maxPoints - 1)) * (width - padX * 2);
  const mapPos = (val) => height - padY - (Math.max(0, Math.min(100, val)) / 100) * (height - padY * 2);
  const mapSpeed = (val) => height - padY - (Math.max(-10, Math.min(30, val)) / 40) * (height - padY * 2);

  const pathPos = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapPos(d.position)}`).join(' ');
  const pathSpeed = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapSpeed(d.velocity)}`).join(' ');
  const pathSetpt = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapPos(d.setpoint)}`).join(' ');

  // Zero-velocity line (since car can now reverse slightly if it overshoots)
  const zeroSpeedY = mapSpeed(0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{width: '100%', height: '100%', overflow: 'visible'}}>
      <g stroke="#f3f4f6" strokeWidth="1">
        {[0, 25, 50, 75, 100].map(pct => {
          const y = padY + (pct / 100) * (height - padY * 2);
          return <line key={`y-${pct}`} x1={padX} y1={y} x2={width - padX} y2={y} />;
        })}
      </g>
      {/* Zero Velocity Reference Line */}
      <line x1={padX} y1={zeroSpeedY} x2={width - padX} y2={zeroSpeedY} stroke="#e5e7eb" strokeWidth="2" strokeDasharray="4,4" />

      <g fill="#9ca3af" fontSize="10" fontFamily="monospace" fontWeight="600">
        <text x={padX - 8} y={padY + 4} textAnchor="end">100m</text>
        <text x={padX - 8} y={height - padY + 4} textAnchor="end">0m</text>
        <text x={width - padX + 8} y={padY + 4} textAnchor="start">30m/s</text>
        <text x={width - padX + 8} y={zeroSpeedY + 4} textAnchor="start">0m/s</text>
      </g>

      <path d={pathSetpt} fill="none" stroke="#d1d5db" strokeWidth="2" strokeDasharray="6,6" />
      <path d={pathSpeed} fill="none" stroke="#9ca3af" strokeWidth="2" />
      <path d={pathPos} fill="none" stroke="#000000" strokeWidth="3" />
    </svg>
  );
};

export default function CarMotion() {
  // Target position is 60 meters away.
  const [params, setParams] = useState({ kp: 1.5, ki: 0.05, kd: 3.0, setpoint: 60, maxSpeed: 25 });
  const [systemActive, setSystemActive] = useState(false);
  const [metrics, setMetrics] = useState({ position: 0, velocity: 0, error: 60 });
  const [history, setHistory] = useState([]);

  const mountRef = useRef(null);
  const MAX_HISTORY = 100;
  
  // Physics engine now tracks Absolute Position, not relative distance.
  const physicsRef = useRef({
    position: 0, 
    velocity: 0,
    integral: 0,
    prevError: 0,
    active: false,
    params: { ...params }
  });

  useEffect(() => { physicsRef.current.active = systemActive; }, [systemActive]);
  useEffect(() => { physicsRef.current.params = params; }, [params]);

  // --- 3D SCENE SETUP ---
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ffffff');
    scene.fog = new THREE.Fog('#ffffff', 20, 150);

    const camera = new THREE.PerspectiveCamera(45, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    scene.add(dirLight);

    const createCar = (isEgo) => {
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: isEgo ? '#111827' : '#ef4444', roughness: 0.3 });
      
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 5), bodyMat);
      chassis.position.y = 0.6;
      chassis.castShadow = true;
      group.add(chassis);

      const cabinMat = new THREE.MeshStandardMaterial({ color: isEgo ? '#000000' : '#7f1d1d', roughness: 0.1 });
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 2.8), cabinMat);
      cabin.position.set(0, 1.35, -0.2);
      cabin.castShadow = true;
      group.add(cabin);

      const wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
      wheelGeom.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: '#111111' });
      
      [[-1.3, 0.4, 1.6], [1.3, 0.4, 1.6], [-1.3, 0.4, -1.6], [1.3, 0.4, -1.6]].forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(...pos);
        wheel.castShadow = true;
        group.add(wheel);
      });
      return group;
    };

    const egoCar = createCar(true);
    scene.add(egoCar);

    // The target is a red parked car
    const targetCar = createCar(false);
    scene.add(targetCar);

    // Static Ground (It does not move anymore!)
    const groundGeom = new THREE.PlaneGeometry(200, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: '#f9fafb', depthWrite: true });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -100; // Center it far ahead
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(200, 100, '#e5e7eb', '#f3f4f6');
    gridHelper.position.set(0, 0.01, -100);
    scene.add(gridHelper);

    // Add a visual "Stop Line"
    const lineMat = new THREE.MeshBasicMaterial({ color: '#000000' });
    const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.5), lineMat);
    stopLine.rotation.x = -Math.PI / 2;
    stopLine.position.y = 0.02;
    scene.add(stopLine);

    const clock = new THREE.Clock();
    let animationFrameId;
    let lastUiUpdate = 0;
    let localHistory = [];

    const animate = () => {
      const state = physicsRef.current;
      const dt = Math.min(clock.getDelta(), 0.1); 

      // ERROR = TARGET POSITION - CURRENT POSITION
      const error = state.params.setpoint - state.position;
      let acceleration = 0;

      if (state.active) {
        // Stop Deadband: If we are extremely close and moving very slowly, STOP completely.
        if (Math.abs(error) < 0.05 && Math.abs(state.velocity) < 0.1) {
          state.velocity = 0;
          state.integral = 0;
          acceleration = 0;
        } else {
          // PID Math
          if (Math.abs(error) < 20) state.integral += error * dt;
          const derivative = (error - state.prevError) / dt;
          
          acceleration = (state.params.kp * error) + (state.params.ki * state.integral) + (state.params.kd * derivative);
          
          // Add physical rolling resistance (makes tuning easier and prevents infinite wobbling)
          acceleration -= state.velocity * 0.2; 
        }
      } else {
        // Coasting to a stop if system disabled
        if (state.velocity > 0) acceleration = -5;
        else if (state.velocity < 0) acceleration = 5;
        if (Math.abs(state.velocity) < 0.2) { state.velocity = 0; acceleration = 0; }
        state.integral = 0;
      }
      state.prevError = error;

      // Update Physics
      state.velocity += acceleration * dt;
      // Clamp velocity so it doesn't exceed max speed (allows minor reversing for overshoot correction)
      state.velocity = Math.max(-10, Math.min(state.params.maxSpeed, state.velocity));
      
      state.position += state.velocity * dt;

      // Update 3D Visuals (Moving along the negative Z axis)
      egoCar.position.z = -state.position;
      
      // Place the target car and stop line at the setpoint
      targetCar.position.z = -state.params.setpoint - 6; // Placed slightly behind the stop line
      stopLine.position.z = -state.params.setpoint;

      // Camera chases the Ego car
      camera.position.set(-15, 12, -state.position + 20);
      camera.lookAt(0, 0, -state.position - 5);

      // UI Update
      const now = clock.getElapsedTime();
      if (now - lastUiUpdate > 0.1) {
        setMetrics({
          position: state.position.toFixed(1),
          velocity: state.velocity.toFixed(1),
          error: error.toFixed(1)
        });

        localHistory.push({ position: state.position, velocity: state.velocity, setpoint: state.params.setpoint });
        if (localHistory.length > MAX_HISTORY) localHistory.shift();
        setHistory([...localHistory]);
        lastUiUpdate = now;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      currentMount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const resetSimulation = () => {
    physicsRef.current.position = 0;
    physicsRef.current.velocity = 0;
    physicsRef.current.integral = 0;
    physicsRef.current.prevError = 0;
    setHistory([]);
  };

  return (
    <div className="sim-container">
      <div className="sim-sidebar">
        <header className="sim-header">
          <h1>PID-CONTROL-CAR</h1>
          <p>Absolute Position Control</p>
        </header>

        <div className="metric-grid">
          <div className="metric-box">
            <span className="metric-label">Absolute Position</span>
            <p className="metric-value">{metrics.position}m</p>
          </div>
          <div className="metric-box">
            <span className="metric-label">Velocity</span>
            <p className="metric-value">{metrics.velocity} m/s</p>
          </div>
          <div className="metric-box wide">
            <span className="metric-label">Distance to Target e(t)</span>
            <p className="metric-value">{metrics.error}m</p>
          </div>
        </div>

        <div className="btn-row">
          <button className={`btn btn-power ${systemActive ? 'active' : ''}`} onClick={() => setSystemActive(!systemActive)}>
            {systemActive ? 'System Active' : 'Engage Drive'}
          </button>
          <button className="btn btn-obstacle" onClick={resetSimulation}>
            Reset Position
          </button>
        </div>

        <div className="tuning-section">
          <div>
            <h2 className="tuning-title">Destination</h2>
            <div className="slider-group mt-4">
              <div className="slider-info"><span>Target Position (Stop Line)</span><span className="slider-val">{params.setpoint} m</span></div>
              <input type="range" name="setpoint" min="20" max="100" step="1" value={params.setpoint} onChange={handleParamChange} />
            </div>
          </div>

          <div style={{marginTop: '16px'}}>
            <h2 className="tuning-title">PID Tuning</h2>
            <div className="slider-group" style={{marginTop: '16px'}}>
              <div className="slider-info"><span>Proportional (Kp) - Power</span><span className="slider-val">{params.kp}</span></div>
              <input type="range" name="kp" min="0" max="5" step="0.1" value={params.kp} onChange={handleParamChange} />
            </div>

            <div className="slider-group" style={{marginTop: '16px'}}>
              <div className="slider-info"><span>Integral (Ki) - Memory</span><span className="slider-val">{params.ki}</span></div>
              <input type="range" name="ki" min="0" max="0.5" step="0.01" value={params.ki} onChange={handleParamChange} />
            </div>

            <div className="slider-group" style={{marginTop: '16px'}}>
              <div className="slider-info"><span>Derivative (Kd) - Braking</span><span className="slider-val">{params.kd}</span></div>
              <input type="range" name="kd" min="0" max="10" step="0.1" value={params.kd} onChange={handleParamChange} />
            </div>
          </div>
        </div>
      </div>

      <div className="sim-main">
        <div className="sim-3d-view" ref={mountRef}>
          <div className="camera-badge">CHASE CAMERA // STATIC WORLD</div>
        </div>

        <div className="sim-graph-view">
          <div className="graph-header">
            <h2 className="graph-title">Position Telemetry</h2>
            <div className="graph-legend">
              <div className="legend-item"><div className="legend-color" style={{background: '#000000'}}></div> Position</div>
              <div className="legend-item"><div className="legend-color" style={{background: '#9ca3af'}}></div> Velocity</div>
              <div className="legend-item"><div className="legend-color" style={{background: '#d1d5db'}}></div> Target</div>
            </div>
          </div>
          
          <div className="graph-container">
            <TelemetryGraph data={history} maxPoints={MAX_HISTORY} />
          </div>
        </div>
      </div>
    </div>
  );
}

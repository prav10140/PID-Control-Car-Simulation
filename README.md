# PID Control System Simulation (MATLAB + React 3D)

This project demonstrates a **PID (Proportional–Integral–Derivative) Controller** applied to a **car distance control system** using:

- MATLAB (for analysis & graphs)
- React 3D Simulation (for real-time visualization)

The system moves a car to a target distance using PID control and shows how tuning affects behavior.

---

## Objective

- Understand PID control in theory and practice  
- Visualize system response in graphs (MATLAB)  
- Observe real-time motion in a 3D simulation (React)  
- Perform PID tuning experiments  

---

## PID Controller Equation

u(t) = Kp * e(t) + Ki * ∫e(t)dt + Kd * de(t)/dt  

Where:
- e(t) = Target - Current Position  
- Kp → Controls speed  
- Ki → Removes steady-state error  
- Kd → Prevents overshoot  

---

## System Overview

### MATLAB
- Simulates system mathematically  
- Generates **position vs time graph**  
- Helps analyze overshoot, settling time  

### React 3D Simulation
- Visualizes car movement in real-time  
- Shows how PID affects motion  
- Interactive and intuitive understanding  

---

# Experiments (PID Tuning)

---

## Experiment 1: Proportional Only (Kp)
**Parameters:**
Kp = 3
Ki = 0
Kd = 0

**Behavior:**
- Car moves fast  
- Overshoots target  
- Oscillates continuously  

**MATLAB Output:**
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/b02eea6d-6497-4214-97fa-7bb4ea6e5ccc" />



---

## Experiment 2: Add Derivative (Kd)

**Parameters:**
Kp = 3
Ki = 0
Kd = 8


**Behavior:**
- Smooth stopping  
- No oscillation  
- Stable system  

**MATLAB Output:**
<img width="1895" height="1070" alt="Screenshot 2026-03-27 020458" src="https://github.com/user-attachments/assets/7bfdeff9-c602-4743-bdfe-84efbc2ad421" />


---

## Experiment 3: Add Integral (Ki)

**Parameters:**
Kp = 1.5
Ki = 0.5
Kd = 2

**Behavior:**
- Removes steady-state error  
- Large overshoot  
- Slow stabilization  

**MATLAB Output:**
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/51e7934c-2bca-4589-b34d-aa430bd69cce" />




---

# Final Tuned PID (Best Result)

**Parameters:**
Kp = 2.5
Ki = 0.01
Kd = 6.5

**Behavior:**
- Fast response  
- Minimal overshoot  
- Stable and accurate  

**MATLAB Output:**
<img width="1916" height="1079" alt="image" src="https://github.com/user-attachments/assets/f2967a74-ee07-4643-9fcd-85851383c51c" />



---

# Key Learning

- **Kp → Speed of response**
- **Kd → Stability (reduces oscillation)**
- **Ki → Accuracy (removes error)**

---

# Conclusion

This project bridges theory and visualization by combining MATLAB analysis with a real-time React simulation.

It demonstrates how PID tuning directly affects system performance in both mathematical and physical representations.

---

# Tech Stack

- MATLAB  
- React.js  
- Three.js / React Three Fiber (for 3D simulation)

---

# Future Improvements

- Integration with hardware (ESP32 / sensors)  
- Web dashboard for live monitoring  

---

If you like this project, give it a star!

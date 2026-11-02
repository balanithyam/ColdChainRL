# Cold-Chain Spoilage Prevention Using Adaptive Reinforcement Learning

> **B.Tech Computational Intelligence / Simulation Using Modern Tools Capstone Project**  
> An autonomous closed-loop Reinforcement Learning simulation and decision-support system for thermodynamic multi-unit cold-chain asset regulation, perishability minimization, and energy efficiency.

---

## Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Motivation & Computational Intelligence Rationale](#2-motivation--computational-intelligence-rationale)
3. [System Architecture](#3-system-architecture)
4. [Mathematical Formulation](#4-mathematical-formulation)
   - [State Space Representation](#state-space-representation)
   - [Action Space](#action-space)
   - [Tabular Q-Learning Algorithmic Update](#tabular-q-learning-algorithmic-update)
   - [Multi-Objective Reward Formulation](#multi-objective-reward-formulation)
5. [Thermodynamic & Biological Simulation Models](#5-thermodynamic--biological-simulation-models)
   - [Thermal Dynamics & Heat Exchange](#thermal-dynamics--heat-exchange)
   - [Arrhenius-Inspired Perishable Spoilage Kinetics](#arrhenius-inspired-perishable-spoilage-kinetics)
   - [Energy Consumption Formulation](#energy-consumption-formulation)
   - [Dynamic Multi-Factor Risk Assessment](#dynamic-multi-factor-risk-assessment)
6. [Disturbance Injections & What-If Stress Testing](#6-disturbance-injections--what-if-stress-testing)
7. [Multi-Unit Fleet Topology](#7-multi-unit-fleet-topology)
8. [The 7 Specialized Control Room Interfaces](#8-the-7-specialized-control-room-interfaces)
9. [Autonomous Incident Detection & Recovery Forensics](#9-autonomous-incident-detection--recovery-forensics)
10. [Empirical Strategy Benchmarking](#10-empirical-strategy-benchmarking)
11. [Technology Stack](#11-technology-stack)
12. [Database Schema & Data Persistence](#12-database-schema--data-persistence)
13. [Installation & Execution Guide](#13-installation--execution-guide)
14. [Step-by-Step Live Demonstration Workflow](#14-step-by-step-live-demonstration-workflow)
15. [Limitations & Future Enhancements](#15-limitations--future-enhancements)

---

## 1. Executive Summary & Problem Statement
Refrigerated supply chains (cold chains) transport temperature-sensitive biological and food goods (e.g., dairy, fresh produce, frozen meat, vaccines). Over **30% of perishable foodstuffs are wasted globally** due to cold-chain thermal breaches, compressor failures, transport delays, and ambient heat influx.

Traditional refrigeration relies on **static thermostat hysteretic rules** (bang-bang control) which:
1. React purely to immediate temperature threshold crossings without anticipating microbial growth kinetics.
2. Cause aggressive compressor cycling, resulting in high energy waste and electrical peak surge.
3. Lack adaptive mechanisms to counter transient environmental shocks (such as container door openings or ambient solar radiation peaks).

This project implements an **adaptive Tabular Q-Learning agent** operating within a closed-loop thermodynamic simulation environment to dynamically control cooling capacity, maintain cargo within product-specific biological safety bands, minimize cumulative spoilage, and economize energy consumption.

---

## 2. Motivation & Computational Intelligence Rationale
In Computational Intelligence (CI), Reinforcement Learning (RL) provides an optimal paradigm for sequential decision-making under uncertainty without requiring pre-labeled training data or static rule hand-crafting.

The agent interacts with the simulated environment in discrete time intervals:
$$\text{Observe State } s_t \longrightarrow \text{Select Cooling Action } a_t \longrightarrow \text{Thermodynamic Transition } s_{t+1} \longrightarrow \text{Compute Reward } r_t \longrightarrow \text{Update } Q(s_t, a_t)$$

Through continuous interaction and exploration-exploitation annealing ($\epsilon$-greedy policy), the agent discovers optimal trade-offs between biological preservation and electrical energy cost.

---

## 3. System Architecture

```
+-----------------------------------------------------------------------------------+
|                            REACT CONTROL ROOM FRONTEND                            |
|  [Live Monitor]  [Unit Mgmt]  [AI Decision]  [Simulation Lab]  [Benchmark]  ...   |
+----------------------------------------+------------------------------------------+
                                         | REST APIs / WebSocket Telemetry (1.0 Hz)
                                         v
+-----------------------------------------------------------------------------------+
|                              FASTAPI BACKEND ENGINE                               |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  | Authentication     |   | Unit Fleet & Physics|   | Real-Time Telemetry      |  |
|  | JWT / bcrypt User  |   | Product Profile DB  |   | WebSocket Broadcaster    |  |
|  +--------------------+   +---------------------+   +--------------------------+  |
|                                        |                                          |
|                                        v                                          |
|  +-----------------------------------------------------------------------------+  |
|  |                        SIMULATION & RL CORE ENGINE                          |  |
|  |  +------------------+     +-------------------+     +--------------------+  |  |
|  |  | State Observer   | --> | Tabular Q-Agent   | --> | Actuator Control   |  |  |
|  |  | (Discretization) |     | (Epsilon-Greedy)  |     | (0:Dec, 1:Mnt, 2:Inc)|  |
|  |  +------------------+     +-------------------+     +--------------------+  |  |
|  |           ^                         |                          |            |  |
|  |           |                         v                          v            |  |
|  |  +------------------+     +-------------------+     +--------------------+  |  |
|  |  | Bellman Update   | <-- | Multi-Reward Calc | <-- | Thermodynamic Env  |  |  |
|  |  | Q-Table Matrix   |     | (Safety/Spoil/Eng)|     | Heat/Spoilage/Risk |  |  |
|  |  +------------------+     +-------------------+     +--------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        DATABASE & PERSISTENCE (PostgreSQL / SQLite)               |
|  - users  - cold_chain_units  - product_profiles  - simulation_runs  - incidents  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Mathematical Formulation

### State Space Representation
The continuous thermodynamic state vector $\mathbf{x} = [T, H, S, R]$ is mapped into a discrete state index $s \in \mathcal{S}$ consisting of **180 discrete states**:
* **Temperature Zones ($T \in \{0, 1, 2, 3, 4\}$):**
  - $T_0$: `CRITICALLY_COLD` ($T < T_{\min} - 2.0$)
  - $T_1$: `SUB_OPTIMAL_COLD` ($T_{\min} - 2.0 \le T < T_{\min}$)
  - $T_2$: `OPTIMAL_SAFE` ($T_{\min} \le T \le T_{\max}$)
  - $T_3$: `WARM_WARNING` ($T_{\max} < T \le T_{\max} + 2.5$)
  - $T_4$: `CRITICALLY_HOT` ($T > T_{\max} + 2.5$)
* **Humidity Zones ($H \in \{0, 1, 2\}$):**
  - $H_0$: `LOW_HUMIDITY` ($H < H_{\min}$)
  - $H_1$: `OPTIMAL_HUMIDITY` ($H_{\min} \le H \le H_{\max}$)
  - $H_2$: `HIGH_HUMIDITY` ($H > H_{\max}$)
* **Spoilage Zones ($S \in \{0, 1, 2, 3\}$):**
  - $S_0$: `FRESH` ($S < 0.05$)
  - $S_1$: `EARLY_DEGRADATION` ($0.05 \le S < 0.15$)
  - $S_2$: `MODERATE_SPOILAGE` ($0.15 \le S < 0.35$)
  - $S_3$: `CRITICAL_SPOILED` ($S \ge 0.35$)
* **Risk Zones ($R \in \{0, 1, 2\}$):**
  - $R_0$: `LOW_RISK` ($R < 30.0$)
  - $R_1$: `ELEVATED_RISK` ($30.0 \le R < 65.0$)
  - $R_2$: `CRITICAL_RISK` ($R \ge 65.0$)

$$\text{State Index: } s = (T \times 36) + (H \times 12) + (S \times 3) + R \quad \in [0, 179]$$

### Action Space
The agent chooses among 3 discrete actuation decisions $a \in \mathcal{A} = \{0, 1, 2\}$:
* $a = 0$: **Decrease Cooling** ($\text{Level } \max(0, L - 1)$) $\longrightarrow$ Low electrical draw ($0.05 \text{ kWh/step}$)
* $a = 1$: **Maintain Cooling** ($\text{Level } L$) $\longrightarrow$ Moderate electrical draw ($0.15 \text{ kWh/step}$)
* $a = 2$: **Increase Cooling** ($\text{Level } \min(2, L + 1)$) $\longrightarrow$ High electrical draw ($0.35 \text{ kWh/step}$)

### Tabular Q-Learning Algorithmic Update
The Q-matrix is updated using the Bellman optimality equation with learning rate $\alpha$ and discount factor $\gamma$:

$$Q(s_t, a_t) \longleftarrow Q(s_t, a_t) + \alpha \left[ r_t + \gamma \max_{a' \in \mathcal{A}} Q(s_{t+1}, a') - Q(s_t, a_t) \right]$$

Action selection follows an $\epsilon$-greedy policy:
$$a_t = \begin{cases} \text{UniformRandom}(\mathcal{A}) & \text{with probability } \epsilon \\ \arg\max_{a} Q(s_t, a) & \text{with probability } 1 - \epsilon \end{cases}$$

### Multi-Objective Reward Formulation
The composite scalar reward function balances four competing objectives:

$$r_t = r_{\text{safety}} + r_{\text{spoilage}} + r_{\text{energy}} + r_{\text{stability}}$$

1. **Temperature Safety ($r_{\text{safety}}$):**
   $$r_{\text{safety}} = \begin{cases} +2.0 & \text{if } T_{\min} \le T_t \le T_{\max} \\ -1.5 \times |T_t - T_{\text{opt}}| & \text{if } T_t \notin [T_{\min}, T_{\max}] \end{cases}$$
2. **Spoilage Penalty ($r_{\text{spoilage}}$):**
   $$r_{\text{spoilage}} = -20.0 \times \Delta S_t - 5.0 \times S_t^2$$
3. **Energy Expenditure Cost ($r_{\text{energy}}$):**
   $$r_{\text{energy}} = -0.15 \times \text{CoolingPowerFactor}(a_t)$$
4. **Actuator Stability Penalty ($r_{\text{stability}}$):**
   $$r_{\text{stability}} = \begin{cases} -0.2 & \text{if } a_t \neq a_{t-1} \text{ (rapid actuator switching)} \\ 0.0 & \text{otherwise} \end{cases}$$

---

## 5. Thermodynamic & Biological Simulation Models

### Thermal Dynamics & Heat Exchange
The temperature inside compartment $i$ evolves over step $\Delta t$:

$$T_{t+1} = T_t + \frac{1}{M_{\text{thermal}}} \left[ k_{\text{ambient}} (T_{\text{ambient}} - T_t) - P_{\text{cooling}}(L_t) \cdot C_{\text{capacity}} + \delta_{\text{disturbance}} \right] \Delta t + \mathcal{N}(0, \sigma_T^2)$$

### Arrhenius-Inspired Perishable Spoilage Kinetics
Spoilage accumulates irreversibly based on thermal acceleration and product sensitivity $\mu_{\text{product}}$:

$$\Delta S_t = \mu_{\text{product}} \cdot \exp\left( \frac{\max(0, T_t - T_{\max})}{2.5} \right) \cdot (1.0 + 0.3 \cdot \max(0, H_t - H_{\max})) \cdot \Delta t$$
$$S_{t+1} = \min(1.0, S_t + \Delta S_t)$$

### Dynamic Multi-Factor Risk Assessment
$$R_t = 0.4 \times \left( \frac{|T_t - T_{\text{opt}}|}{\text{BandWidth}} \times 100 \right) + 0.35 \times (S_t \times 100) + 0.25 \times \text{DisturbanceWeight}$$

---

## 6. Disturbance Injections & What-If Stress Testing
The simulation engine supports live stochastic disturbance injections:
* **Temperature Spike:** Sudden $+5.0^\circ\text{C}$ thermal load simulating solar radiation or loading bay delay.
* **Door Opening:** $+4.0^\circ\text{C}$ influx with $+25\%$ humidity surge for 6 consecutive steps.
* **Ambient Heat Wave:** $+8.0^\circ\text{C}$ ambient atmospheric rise.
* **Cooling Capacity Reduction:** $-30\%$ compressor power simulating partial mechanical failure.

---

## 7. Multi-Unit Fleet Topology
The system manages real heterogeneous cold-chain assets concurrently:
1. `WH-01`: Primary Cold Warehouse (Product: **Dairy**, Safe Band: $+2^\circ\text{C}$ to $+6^\circ\text{C}$)
2. `CON-01`: Reefer Container ISO-40ft (Product: **Fresh Produce**, Safe Band: $+8^\circ\text{C}$ to $+13^\circ\text{C}$)
3. `CON-02`: Reefer Container ISO-20ft (Product: **Frozen Goods**, Safe Band: $-22^\circ\text{C}$ to $-15^\circ\text{C}$)
4. `TRANS-01`: Refrigerated Transit Vehicle (Product: **Dairy**, Safe Band: $+2^\circ\text{C}$ to $+6^\circ\text{C}$)

---

## 8. The 7 Specialized Control Room Interfaces

| Page Name | Strict UI Purpose | Visualization Strategy |
| :--- | :--- | :--- |
| **1. LIVE MONITOR** | Real-time fleet health, live KPIs & telemetric actuation | **Chart-Heavy** (Temp, Spoilage, Energy, Cooling Actions vs Time) |
| **2. UNIT MANAGEMENT** | Asset topologies, safe thermal bands, product profiles | **No Charts** (Clean configuration matrix & modals) |
| **3. AI DECISION CENTER** | State decomposition, reward components, mathematical explainability | **One Compact Q-Value Bar Chart** (Selected action highlight) |
| **4. SIMULATION LAB** | What-if environmental stress testing & step replay | **Chart-Heavy** (Multi-timeline charts & scrubber) |
| **5. STRATEGY BENCHMARK** | Q-Learning vs. Fixed Rule vs. Random Policy | **Chart-Heavy** (Comparative metric bar charts & summary) |
| **6. INCIDENT & RISK CENTER** | Anomaly forensics, recovery times & counter-actions | **Minimal Supporting Charts** (Severity distribution only) |
| **7. RL TRAINING LAB** | Offline training, learning curves & learned policy matrix | **Chart-Heavy** (Reward, Epsilon, Q-Convergence, Coverage) |

---

## 9. Autonomous Incident Detection & Recovery Forensics
When physical conditions breach safety boundaries, incidents are automatically recorded:
* `INC-XXXX`: Unit ID, Timestamp, Anomaly Type, Severity (`Critical` / `High` / `Medium` / `Low`), State Before, RL Counter-Action Taken, Recovery Time (seconds), and Outcome (`Active` $\to$ `Mitigated` $\to$ `Resolved`).

---

## 10. Empirical Strategy Benchmarking
The system evaluates three strategies over identical initial conditions and disturbance timelines:
1. **Fixed Cooling Rule:** Baseline heuristic that turns cooling to High if $T > T_{\max}$ and Low if $T < T_{\min}$.
2. **Random Policy:** Uncontrolled stochastic baseline sampling uniformly $a \sim \mathcal{U}(0, 2)$.
3. **Q-Learning (Adaptive RL):** Closed-loop reinforcement agent trained on multi-objective rewards.

Metrics Evaluated:
* Final Spoilage Accumulation (%)
* Cumulative Energy Consumption (kWh)
* Mean Temperature Deviation ($^\circ\text{C}$)
* Unsafe Duration (Steps)
* Disturbance Recovery Time (Steps)
* Actuator Intervention Count

---

## 11. Technology Stack
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons
* **Backend:** Python 3.10+, FastAPI, Uvicorn, WebSockets, Pydantic v2
* **Reinforcement Learning:** NumPy, Tabular Q-Learning with $\epsilon$-annealing
* **Simulation Engine:** SimPy / Python Thermodynamic Stochastic Engine
* **Database & ORM:** SQLAlchemy 2.0 (SQLite / PostgreSQL)
* **Authentication & Security:** JWT (JSON Web Tokens), bcrypt hashing

---

## 12. Database Schema & Data Persistence
Entities managed:
* `users`: Operator identity, bcrypt password hashes, roles
* `cold_chain_units`: Unit assets, physical parameters, active states
* `product_profiles`: Biological thermal bounds, spoilage sensitivity factors
* `simulation_runs`: Recorded laboratory and benchmark runs
* `simulation_steps`: Granular time-series states, Q-values, actions, rewards
* `incidents`: Automatically detected safety breaches and RL resolutions
* `training_runs`: Recorded Q-learning training runs, loss histories, policy dumps

---

## 13. Installation & Execution Guide

### Prerequisites
* Python 3.10 or higher
* Node.js 18 or higher & npm

### Option A: Local Development Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5180`.

### Option B: Docker Compose Setup
```bash
docker-compose up --build
```

---

## 14. Step-by-Step Live Demonstration Workflow
1. **Registration:**
   - Navigate to `http://localhost:5180/register`
   - Enter name, email, and password meeting complexity requirements (8+ chars, upper, lower, number, special).
   - Verify that the system redirects to `/register-success` without auto-login.
2. **Authentication:**
   - Sign in using the registered credentials or default demo credentials:
     - Email: `operator@coldchain.ai`
     - Password: `Password123!`
3. **Live Monitor:**
   - View the 7 global KPIs and 4 real-time unit cards.
   - Click **Start** to initiate the backend WebSocket simulation stream.
   - Observe live multi-charts (Temperature, Spoilage, Energy, Actions) updating dynamically.
   - Click **+5°C Heat Spike** to inject a live disturbance and watch the RL agent react.
4. **Unit Management:**
   - Navigate to **Unit Management** (no charts).
   - Commission a new cold-chain unit or edit thermal bounds for an existing unit.
5. **AI Decision Center:**
   - Navigate to **AI Decision Center**.
   - Inspect the 4-tuple state encoding (e.g. `T2_H1_S0_R0`), the exact reward breakdown, the Bellman formula, and the compact Q-value bar chart highlighting the chosen action.
6. **Simulation Lab:**
   - Navigate to **Simulation Lab**.
   - Configure a custom scenario and click **Execute Laboratory Simulation**.
   - Use the **Simulation Replay** scrubber to step through past states.
7. **Strategy Benchmark:**
   - Navigate to **Strategy Benchmark**.
   - Click **Run Comparative Benchmark** to run the identical scenario across Fixed Rule, Random Policy, and Q-learning.
   - Inspect the empirical comparison charts and metrics table.
8. **Incident & Risk Center:**
   - Navigate to **Incident & Risk Center**.
   - Review automatically generated anomaly records and RL recovery times.
9. **RL Training Lab:**
   - Navigate to **RL Training Lab**.
   - Configure episodes (e.g., 200) and learning rate ($\alpha=0.1$).
   - Click **Train Reinforcement Agent** and watch reward convergence, epsilon decay, and the generated optimal policy matrix $\pi^*(s)$.

---

## 15. Limitations & Future Enhancements

### Implemented Features (Current System)
* Discrete Tabular Q-Learning with $\epsilon$-greedy exploration and state-action coverage tracking.
* Realistic multi-factor thermodynamic and Arrhenius bio-spoilage simulation models.
* Real-time WebSocket telemetry broadcasting from FastAPI to React.
* Heterogeneous multi-unit fleet configuration.
* Automated incident logging and recovery duration tracking.
* Reproducible comparative strategy benchmarking.

### Future Academic Enhancements (Scope Boundary)
* **Deep Reinforcement Learning (DQN / PPO / SAC):** Continuous state-action spaces using neural network approximators.
* **Physical Hardware Integration:** Integration with physical edge IoT microcontrollers (e.g., ESP32 / Raspberry Pi with DHT22 / DS18B20 sensors).
* **Weather API Integration:** Streaming live atmospheric meteorological forecasts into ambient thermodynamic modeling.

---
**ColdChain-RL** — *Academic Computational Intelligence System for Sustainable Cold-Chain Logistics.*

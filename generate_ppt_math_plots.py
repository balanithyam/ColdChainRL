import os
import matplotlib.pyplot as plt
import numpy as np

PPT_FIGS_DIR = r"d:\ColdChainRL\ppt_figures"
os.makedirs(PPT_FIGS_DIR, exist_ok=True)

# 1. Heat Transfer Model (Lumped Capacitance Pull-Down)
fig, ax = plt.subplots(figsize=(5.5, 3.8), dpi=200)
t = np.linspace(0, 100, 200)
T_init = 12.0
T_set = 3.5
T_amb = 32.0
T_curve = T_set + (T_init - T_set) * np.exp(-0.045 * t)
ax.plot(t, T_curve, color='#2563eb', lw=2.5, label='Chamber Temp T(t)')
ax.axhline(4.0, color='#10b981', ls='--', lw=1.5, label='Safe Max (4.0°C)')
ax.axhline(2.0, color='#10b981', ls='--', lw=1.5, label='Safe Min (2.0°C)')
ax.fill_between(t, 2.0, 4.0, color='#10b981', alpha=0.15, label='Optimal Safe Band')
ax.set_title('Lumped Capacitance Pull-Down Trajectory', fontsize=11, fontweight='bold', pad=10)
ax.set_xlabel('Time Steps (dt = 10s)', fontsize=9)
ax.set_ylabel('Temperature (°C)', fontsize=9)
ax.grid(True, ls=':', alpha=0.6)
ax.legend(fontsize=8, loc='upper right')
plt.tight_layout()
plt.savefig(os.path.join(PPT_FIGS_DIR, "m1_heat_transfer.png"))
plt.close()

# 2. Arrhenius Biological Spoilage Kinetics
fig, ax = plt.subplots(figsize=(5.5, 3.8), dpi=200)
T_celsius = np.linspace(0, 25, 200)
T_kelvin = T_celsius + 273.15
Ea = 50000.0  # J/mol
R = 8.314
k_rate = 1e6 * np.exp(-Ea / (R * T_kelvin))
ax.plot(T_celsius, k_rate, color='#dc2626', lw=2.5, label='Degradation Rate k(T)')
ax.axvline(4.0, color='#16a34a', ls='--', lw=1.5, label='Recommended Limit (4°C)')
ax.fill_between(T_celsius, 0, k_rate, where=(T_celsius > 4.0), color='#fee2e2', alpha=0.7, label='Hazard Acceleration Zone')
ax.set_title('Arrhenius Spoilage Kinetics vs Temperature', fontsize=11, fontweight='bold', pad=10)
ax.set_xlabel('Chamber Temperature (°C)', fontsize=9)
ax.set_ylabel('Reaction Rate Constant k (hr⁻¹)', fontsize=9)
ax.grid(True, ls=':', alpha=0.6)
ax.legend(fontsize=8, loc='upper left')
plt.tight_layout()
plt.savefig(os.path.join(PPT_FIGS_DIR, "m2_arrhenius.png"))
plt.close()

# 3. Compressor Energy Consumption Model
fig, ax = plt.subplots(figsize=(5.5, 3.8), dpi=200)
stages = ['Off (0)', 'Eco (1)', 'Standard (2)', 'Turbo (3)']
power_kw = [0.02, 0.16, 0.35, 0.55]
cost_hr = [0.003, 0.024, 0.052, 0.082]
x = np.arange(len(stages))
bars = ax.bar(x, power_kw, color=['#94a3b8', '#10b981', '#3b82f6', '#f59e0b'], width=0.55, edgecolor='#1e293b', lw=1.2)
for bar in bars:
    yval = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2.0, yval + 0.015, f'{yval:.2f} kW', ha='center', va='bottom', fontsize=9, fontweight='bold')
ax.set_title('Compressor Power Draw by Actuation Level', fontsize=11, fontweight='bold', pad=10)
ax.set_xticks(x)
ax.set_xticklabels(stages, fontsize=9, fontweight='bold')
ax.set_ylabel('Electrical Power Draw (kW)', fontsize=9)
ax.set_ylim(0, 0.68)
ax.grid(axis='y', ls=':', alpha=0.6)
plt.tight_layout()
plt.savefig(os.path.join(PPT_FIGS_DIR, "m3_energy.png"))
plt.close()

# 4. 4-Tuple State-Space Discretization
fig, ax = plt.subplots(figsize=(5.5, 3.8), dpi=200)
ax.axis('off')
tuples = [
    ("Temperature (T)", "5 Zones: T0 (Frozen) to T4 (Hot)", "#dbeafe", "#1e40af"),
    ("Humidity (H)", "3 Zones: H0 (Dry) to H2 (Wet)", "#ccfbf1", "#0f766e"),
    ("Spoilage (S)", "4 Zones: S0 (Fresh) to S3 (Spoiled)", "#f3e8ff", "#6b21a8"),
    ("Risk Index (R)", "3 Zones: R0 (Low) to R2 (Critical)", "#fef3c7", "#b45309"),
]
y_pos = [0.80, 0.56, 0.32, 0.08]
for (name, desc, bg, text_col), y in zip(tuples, y_pos):
    rect = plt.Rectangle((0.05, y), 0.90, 0.18, facecolor=bg, edgecolor=text_col, linewidth=1.5, transform=ax.transAxes)
    ax.add_patch(rect)
    ax.text(0.10, y + 0.11, name, fontsize=10, fontweight='bold', color=text_col, transform=ax.transAxes)
    ax.text(0.10, y + 0.04, desc, fontsize=8.5, color='#334155', transform=ax.transAxes)
ax.text(0.50, 0.96, "Total Discrete States = 5 × 3 × 4 × 3 = 180", fontsize=10, fontweight='bold', ha='center', color='#0f172a', transform=ax.transAxes)
plt.tight_layout()
plt.savefig(os.path.join(PPT_FIGS_DIR, "m4_state_space.png"))
plt.close()

# 5. Epsilon-Greedy Action Selection Policy
fig, ax = plt.subplots(figsize=(5.5, 3.8), dpi=200)
episodes = np.arange(0, 250)
eps = np.maximum(0.02, 1.0 * (0.985 ** episodes))
ax.plot(episodes, eps, color='#4f46e5', lw=2.5, label='Exploration Epsilon ε')
ax.axhline(0.02, color='#e11d48', ls='--', lw=1.5, label='Min Epsilon (0.02)')
ax.fill_between(episodes, eps, 1.0, color='#e0e7ff', alpha=0.5, label='Exploitation Margin')
ax.set_title('Epsilon-Greedy Exploration Decay', fontsize=11, fontweight='bold', pad=10)
ax.set_xlabel('Training Episodes', fontsize=9)
ax.set_ylabel('Exploration Probability ε', fontsize=9)
ax.grid(True, ls=':', alpha=0.6)
ax.legend(fontsize=8, loc='upper right')
plt.tight_layout()
plt.savefig(os.path.join(PPT_FIGS_DIR, "m5_epsilon_decay.png"))
plt.close()

# 6. Bellman Temporal Difference TD Error
fig, ax = plt.subplots(figsize=(5.5, 3.8), dpi=200)
steps = np.arange(0, 100)
td_err = 4.5 * np.exp(-0.06 * steps) + 0.15 * np.random.randn(len(steps))
ax.plot(steps, td_err, color='#0284c7', lw=2.0, label='TD Error δ_t')
ax.axhline(0.0, color='#0f172a', ls='-', lw=1.0)
ax.set_title('Bellman Temporal Difference Convergence', fontsize=11, fontweight='bold', pad=10)
ax.set_xlabel('Iteration Steps', fontsize=9)
ax.set_ylabel('TD Error [r + γ max Q\' - Q]', fontsize=9)
ax.grid(True, ls=':', alpha=0.6)
ax.legend(fontsize=8, loc='upper right')
plt.tight_layout()
plt.savefig(os.path.join(PPT_FIGS_DIR, "m6_bellman_td.png"))
plt.close()

# 7. Multi-Objective Composite Reward Breakdown
fig, ax = plt.subplots(figsize=(5.5, 3.8), dpi=200)
components = ['Thermal Safety', 'Spoilage Damp', 'Power Cost', 'Actuator Chatter', 'Total Step R']
vals = [2.00, -0.22, -0.15, -0.05, 1.58]
cols = ['#10b981', '#a855f7', '#f59e0b', '#64748b', '#4f46e5']
bars = ax.barh(components, vals, color=cols, edgecolor='#1e293b', height=0.55)
ax.axvline(0, color='#0f172a', lw=1.2)
for bar in bars:
    w = bar.get_width()
    offset = 0.05 if w >= 0 else -0.25
    ax.text(w + offset, bar.get_y() + bar.get_height()/2.0, f'{w:+.2f}', va='center', fontsize=9, fontweight='bold')
ax.set_title('Composite Multi-Objective Reward Trade-off', fontsize=11, fontweight='bold', pad=10)
ax.set_xlabel('Reward Magnitude', fontsize=9)
ax.set_xlim(-0.8, 2.6)
ax.grid(axis='x', ls=':', alpha=0.6)
plt.tight_layout()
plt.savefig(os.path.join(PPT_FIGS_DIR, "m7_reward.png"))
plt.close()

# 8. Dynamic Composite Risk Index Model
fig, ax = plt.subplots(figsize=(5.5, 3.8), dpi=200)
labels = ['Thermal Deviation (40%)', 'Arrhenius Spoilage (35%)', 'Ambient Influx (15%)', 'Chamber Humidity (10%)']
sizes = [40, 35, 15, 10]
colors = ['#ef4444', '#a855f7', '#f59e0b', '#06b6d4']
explode = (0.05, 0.05, 0.0, 0.0)
ax.pie(sizes, explode=explode, labels=labels, colors=colors, autopct='%1.0f%%', startangle=140, textprops={'fontsize': 8.5, 'fontweight': 'bold'})
ax.set_title('Dynamic Cold-Chain Composite Risk Weights', fontsize=11, fontweight='bold', pad=10)
plt.tight_layout()
plt.savefig(os.path.join(PPT_FIGS_DIR, "m8_risk_index.png"))
plt.close()

# 9. Kalman Filter Telemetry Noise Smoothing
fig, ax = plt.subplots(figsize=(5.5, 3.8), dpi=200)
np.random.seed(42)
t_kalman = np.linspace(0, 50, 100)
true_signal = 3.5 + 0.8 * np.sin(0.12 * t_kalman)
noisy_signal = true_signal + np.random.normal(0, 0.45, len(t_kalman))
kalman_est = np.zeros_like(noisy_signal)
x_hat = noisy_signal[0]
p = 1.0
q = 0.01
r = 0.20
for i in range(len(noisy_signal)):
    p = p + q
    k = p / (p + r)
    x_hat = x_hat + k * (noisy_signal[i] - x_hat)
    p = (1 - k) * p
    kalman_est[i] = x_hat
ax.plot(t_kalman, noisy_signal, color='#94a3b8', alpha=0.75, lw=1.2, label='Raw Sensor Telemetry')
ax.plot(t_kalman, kalman_est, color='#4f46e5', lw=2.4, label='Kalman Filtered State')
ax.plot(t_kalman, true_signal, color='#10b981', ls='--', lw=1.5, label='True Ground Truth')
ax.set_title('Kalman Filter Telemetry Noise Smoothing', fontsize=11, fontweight='bold', pad=10)
ax.set_xlabel('Time Steps (dt = 10s)', fontsize=9)
ax.set_ylabel('Chamber Temperature (°C)', fontsize=9)
ax.grid(True, ls=':', alpha=0.6)
ax.legend(fontsize=8, loc='upper right')
plt.tight_layout()
plt.savefig(os.path.join(PPT_FIGS_DIR, "m9_kalman.png"))
plt.close()

# 10. Thermal Disturbance Heat Ingress Flux
fig, ax = plt.subplots(figsize=(5.5, 3.8), dpi=200)
t_dist = np.linspace(0, 80, 160)
spike = np.zeros_like(t_dist)
spike[(t_dist >= 20) & (t_dist <= 35)] = 5.0  # +5C heat ingress
spike[(t_dist >= 55) & (t_dist <= 65)] = 3.5  # Door open influx
ax.fill_between(t_dist, 0, spike, color='#fee2e2', alpha=0.6)
ax.plot(t_dist, spike, color='#e11d48', lw=2.2, label='Disturbance Flux Q_dist (kW)')
ax.set_title('Exogenous Thermal Disturbance Influx Profile', fontsize=11, fontweight='bold', pad=10)
ax.set_xlabel('Simulation Step', fontsize=9)
ax.set_ylabel('Injected Heat Influx (kW)', fontsize=9)
ax.grid(True, ls=':', alpha=0.6)
ax.legend(fontsize=8, loc='upper right')
plt.tight_layout()
plt.savefig(os.path.join(PPT_FIGS_DIR, "m10_disturbance.png"))
plt.close()

print("All 10 mathematical formula plots successfully generated in:", PPT_FIGS_DIR)

import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Zap,
  AlertTriangle,
  DoorOpen,
  DoorClosed,
  CheckCircle,
  Activity,
  Flame,
  Snowflake,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface VisualWarehouseProps {
  productName: string;
  temperature: number;
  safeMin: number;
  safeMax: number;
  humidity: number;
  spoilagePercent: number;
  coolingLevel: number;
  coolingCapacity?: number;
  actionName?: string;
  disturbanceType?: string | null;
  onInjectDisturbance?: (type: string) => void;
  isInteractive?: boolean;
}

export const VisualColdStorageWarehouse: React.FC<VisualWarehouseProps> = ({
  productName,
  temperature,
  safeMin,
  safeMax,
  humidity,
  spoilagePercent,
  coolingLevel,
  coolingCapacity = 100,
  actionName = 'Maintain Cooling',
  disturbanceType = null,
  onInjectDisturbance,
  isInteractive = true,
}) => {
  const isTooHot = temperature > safeMax;
  const isCriticallyHot = temperature > safeMax + 2.5;
  const isTooCold = temperature < safeMin;
  const isOptimal = !isTooHot && !isTooCold;

  // Chamber glow atmosphere styling
  let chamberAtmosphere = 'from-blue-950/20 via-cyan-900/10 to-slate-900/40 border-cyan-500/30';
  let thermalGlowColor = 'rgba(6, 182, 212, 0.15)';
  let tempTextColor = 'text-cyan-400';

  if (isCriticallyHot) {
    chamberAtmosphere = 'from-rose-950/40 via-red-900/20 to-slate-900/60 border-rose-500/50 animate-pulse';
    thermalGlowColor = 'rgba(239, 68, 68, 0.25)';
    tempTextColor = 'text-rose-400';
  } else if (isTooHot) {
    chamberAtmosphere = 'from-amber-950/30 via-orange-900/15 to-slate-900/50 border-amber-500/40';
    thermalGlowColor = 'rgba(245, 158, 11, 0.2)';
    tempTextColor = 'text-amber-400';
  } else if (isTooCold) {
    chamberAtmosphere = 'from-indigo-950/30 via-blue-900/20 to-slate-900/50 border-indigo-400/40';
    thermalGlowColor = 'rgba(99, 102, 241, 0.2)';
    tempTextColor = 'text-indigo-300';
  }

  // Fan spinning speed CSS class
  let fanSpinClass = 'animate-[spin_4s_linear_infinite]';
  if (coolingLevel === 0) fanSpinClass = ''; // stopped/idle
  if (coolingLevel === 2) fanSpinClass = 'animate-[spin_1.2s_linear_infinite]';
  if (coolingLevel === 3) fanSpinClass = 'animate-[spin_0.5s_linear_infinite]';

  // Product specific icons & details
  const getProductItems = () => {
    if (productName.toLowerCase().includes('produce')) {
      return [
        { id: 1, name: 'Crisp Organic Apples', icon: '🍎', qty: '120 Crates' },
        { id: 2, name: 'Hydroponic Greens', icon: '🥦', qty: '95 Crates' },
        { id: 3, name: 'Vine Tomatoes', icon: '🍅', qty: '140 Crates' },
        { id: 4, name: 'Fresh Bell Peppers', icon: '🫑', qty: '80 Crates' },
      ];
    }
    if (productName.toLowerCase().includes('frozen')) {
      return [
        { id: 1, name: 'Deep-Frozen Seafood Pallet', icon: '🐟', qty: '200 Units' },
        { id: 2, name: 'Biological Vaccine Stacks', icon: '🧪', qty: '50 Boxes' },
        { id: 3, name: 'Premium Meat Cuts', icon: '🥩', qty: '160 Boxes' },
        { id: 4, name: 'Cryogenic Ice Cream', icon: '🍨', qty: '110 Tubs' },
      ];
    }
    // Default Dairy
    return [
      { id: 1, name: 'Pasteurized Whole Milk', icon: '🥛', qty: '240 Crates' },
      { id: 2, name: 'Aged Cheddar Wheels', icon: '🧀', qty: '85 Pallets' },
      { id: 3, name: 'Heavy Whipping Cream', icon: '🍶', qty: '110 Crates' },
      { id: 4, name: 'Cultured Greek Yogurt', icon: '🥣', qty: '150 Trays' },
    ];
  };

  const productItems = getProductItems();

  const isDoorOpen = disturbanceType === 'Door Opening' || disturbanceType === 'Temperature Spike';

  return (
    <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl text-white">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Snowflake className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>Live Visual Cold Storage Digital Twin</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                LIVE SENSORS
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Active Commodity: <strong className="text-indigo-300">{productName}</strong> | Safe Envelope: {safeMin}°C to {safeMax}°C
            </p>
          </div>
        </div>

        {/* Real-time Status Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 ${
            isOptimal
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : isCriticallyHot
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {isOptimal ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            <span>{isOptimal ? 'Optimal Equilibrium' : isCriticallyHot ? 'Critical Thermal Hazard' : 'Thermal Warning'}</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
            Action: <strong className="text-indigo-400">{actionName}</strong>
          </div>
        </div>
      </div>

      {/* Main Visual Chamber Cutaway */}
      <div
        className={`relative min-h-[360px] p-6 bg-gradient-to-b ${chamberAtmosphere} transition-all duration-700 overflow-hidden flex flex-col justify-between`}
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, ${thermalGlowColor} 0%, rgba(15, 23, 42, 0.95) 75%)`,
        }}
      >
        {/* Overhead Evaporator Unit & Cooling Fan Section */}
        <div className="flex items-start justify-between">
          {/* Evaporator Unit (Top-Left) */}
          <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-700/80 shadow-lg flex items-center gap-3 backdrop-blur-xs">
            <div className="relative w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
              {/* Spinning Fan */}
              <Wind
                className={`w-7 h-7 text-cyan-400 transition-all ${fanSpinClass}`}
              />
              {coolingLevel > 0 && (
                <div className="absolute inset-0 bg-cyan-500/10 animate-pulse rounded-lg" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Evaporator Chiller
                </span>
                <span className={`text-[10px] font-bold px-1.5 rounded ${
                  coolingLevel === 3 ? 'bg-cyan-500/20 text-cyan-300' : coolingLevel > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  Level {coolingLevel} ({coolingLevel === 3 ? 'Turbo' : coolingLevel === 2 ? 'High' : coolingLevel === 1 ? 'Eco' : 'Off'})
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                Power Draw: {coolingLevel === 3 ? '0.35 kW' : coolingLevel === 2 ? '0.25 kW' : coolingLevel === 1 ? '0.15 kW' : '0.00 kW'}
              </div>
              <div className="text-[10px] text-slate-400">
                Capacity Health: <strong className="text-slate-200">{coolingCapacity.toFixed(0)}%</strong>
              </div>
            </div>
          </div>

          {/* Floating Atmospheric Telemetry Gauges (Top-Right) */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-700/80 backdrop-blur-xs text-right shadow-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Internal Air Temp</span>
              <div className={`text-xl font-mono font-black ${tempTextColor} tracking-tight`}>
                {temperature.toFixed(2)} °C
              </div>
              <span className="text-[10px] text-slate-400">
                Target: {((safeMin + safeMax) / 2).toFixed(1)} °C
              </span>
            </div>

            <div className="bg-slate-950/90 rounded-xl p-3 border border-slate-700/80 backdrop-blur-xs text-right shadow-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Humidity</span>
              <div className="text-xl font-mono font-black text-teal-400 tracking-tight">
                {humidity.toFixed(1)} %
              </div>
              <span className="text-[10px] text-slate-400">
                Spoilage: <strong className="text-purple-400 font-mono">{(spoilagePercent * 100).toFixed(2)}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Cold Airflow Current Streams (Visual Particle Lines) */}
        {coolingLevel > 0 && (
          <div className="absolute top-20 left-16 right-24 pointer-events-none flex justify-around opacity-40">
            <div className="w-0.5 h-24 bg-gradient-to-b from-cyan-400 via-cyan-300/40 to-transparent animate-pulse" />
            <div className="w-0.5 h-32 bg-gradient-to-b from-cyan-400 via-cyan-300/40 to-transparent animate-pulse delay-100" />
            <div className="w-0.5 h-28 bg-gradient-to-b from-cyan-400 via-cyan-300/40 to-transparent animate-pulse delay-200" />
            <div className="w-0.5 h-36 bg-gradient-to-b from-cyan-400 via-cyan-300/40 to-transparent animate-pulse delay-300" />
          </div>
        )}

        {/* Center Storage Floor with Cargo Stacks & Visual Pallets */}
        <div className="my-6 z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {productItems.map((item, idx) => {
              const palletSpoilage = Math.min(100, spoilagePercent * 100 * (1 + idx * 0.15));
              const isPalletFresh = palletSpoilage < 3.0;
              const isPalletDegrading = palletSpoilage >= 3.0 && palletSpoilage < 15.0;

              return (
                <div
                  key={item.id}
                  className={`relative p-3.5 rounded-xl border transition-all duration-500 backdrop-blur-xs ${
                    isPalletFresh
                      ? 'bg-slate-950/80 border-slate-700/80 hover:border-cyan-500/50'
                      : isPalletDegrading
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-rose-950/40 border-rose-500/60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl select-none">{item.icon}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isPalletFresh
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isPalletDegrading
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                    }`}>
                      {isPalletFresh ? '100% Fresh' : isPalletDegrading ? 'Degrading' : 'Spoilage Hazard'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-mono">
                    <span>{item.qty}</span>
                    <span className={isPalletFresh ? 'text-cyan-300' : 'text-rose-400'}>
                      Core: {(temperature + 0.3 * idx).toFixed(1)}°C
                    </span>
                  </div>

                  {/* Freshness Bar */}
                  <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isPalletFresh ? 'bg-emerald-400' : isPalletDegrading ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(5, 100 - palletSpoilage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Floor & Loading Dock Door Animation (Bottom Area) */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Door Status */}
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              isDoorOpen
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {isDoorOpen ? <DoorOpen className="w-4 h-4" /> : <DoorClosed className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Chamber Seal Status
              </span>
              <div className="text-xs font-bold">
                {isDoorOpen ? (
                  <span className="text-rose-400">⚠️ Door Open — Heat Ingress Active</span>
                ) : (
                  <span className="text-emerald-400">✓ Fully Sealed Thermal Envelope</span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Physical Disturbance Buttons */}
          {isInteractive && onInjectDisturbance && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Inject Physical Hazard:</span>
              <button
                onClick={() => onInjectDisturbance('Door Opening')}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all"
              >
                🚪 Open Door (+4°C)
              </button>
              <button
                onClick={() => onInjectDisturbance('Temperature Spike')}
                className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition-all"
              >
                🔥 Heat Influx (+6°C)
              </button>
              <button
                onClick={() => onInjectDisturbance('Cooling Capacity Reduction')}
                className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-all"
              >
                ⚡ Power Drop 50%
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

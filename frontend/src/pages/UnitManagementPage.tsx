import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Thermometer,
  Shield,
  Wind,
  Zap,
  Info,
  X
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { unitsService } from '../services/api';
import { ColdChainUnit, ProductProfile } from '../types';
import { useSimulation } from '../context/SimulationContext';

export const UnitManagementPage: React.FC = () => {
  const { refreshUnits } = useSimulation();
  const [units, setUnits] = useState<ColdChainUnit[]>([]);
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUnitId, setEditUnitId] = useState<number | null>(null);
  const [selectedViewUnit, setSelectedViewUnit] = useState<ColdChainUnit | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [unitId, setUnitId] = useState('');
  const [unitType, setUnitType] = useState('Reefer Container (ISO-40ft)');
  const [productProfileId, setProductProfileId] = useState<number>(1);
  const [safeMin, setSafeMin] = useState<number>(2.0);
  const [safeMax, setSafeMax] = useState<number>(6.0);
  const [initialTemp, setInitialTemp] = useState<number>(4.0);
  const [initialHumidity, setInitialHumidity] = useState<number>(70.0);
  const [coolingCapacity, setCoolingCapacity] = useState<number>(100.0);
  const [initialSpoilage, setInitialSpoilage] = useState<number>(0.0);
  const [ambientTemp, setAmbientTemp] = useState<number>(28.0);
  const [ambientHumidity, setAmbientHumidity] = useState<number>(65.0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, pRes] = await Promise.all([
        unitsService.getUnits(),
        unitsService.getProducts(),
      ]);
      setUnits(uRes.data);
      setProducts(pRes.data);
      if (pRes.data.length > 0 && !editUnitId) {
        setProductProfileId(pRes.data[0].id);
        setSafeMin(pRes.data[0].safe_temp_min);
        setSafeMax(pRes.data[0].safe_temp_max);
        setInitialTemp(pRes.data[0].optimum_temp);
      }
    } catch (e: any) {
      setErrorMsg('Failed to load fleet and product profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductChange = (prodId: number) => {
    setProductProfileId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setSafeMin(prod.safe_temp_min);
      setSafeMax(prod.safe_temp_max);
      setInitialTemp(prod.optimum_temp);
    }
  };

  const openCreateModal = () => {
    setEditUnitId(null);
    setUnitId(`UNIT-${String(units.length + 1).padStart(2, '0')}`);
    setUnitType('Reefer Container (ISO-40ft)');
    if (products.length > 0) {
      handleProductChange(products[0].id);
    }
    setInitialHumidity(70.0);
    setCoolingCapacity(100.0);
    setInitialSpoilage(0.0);
    setAmbientTemp(28.0);
    setAmbientHumidity(65.0);
    setModalOpen(true);
    setErrorMsg('');
  };

  const openEditModal = (u: ColdChainUnit) => {
    setEditUnitId(u.id);
    setUnitId(u.unit_id);
    setUnitType(u.unit_type);
    setProductProfileId(u.product_profile_id);
    setSafeMin(u.safe_temp_min);
    setSafeMax(u.safe_temp_max);
    setInitialTemp(u.current_temp);
    setInitialHumidity(u.current_humidity);
    setCoolingCapacity(u.cooling_capacity);
    setInitialSpoilage(u.current_spoilage);
    setAmbientTemp(u.ambient_temp);
    setAmbientHumidity(u.ambient_humidity);
    setModalOpen(true);
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (editUnitId) {
        await unitsService.updateUnit(editUnitId, {
          unit_type: unitType,
          product_profile_id: productProfileId,
          safe_temp_min: safeMin,
          safe_temp_max: safeMax,
          cooling_capacity: coolingCapacity,
          ambient_temp: ambientTemp,
          ambient_humidity: ambientHumidity,
        });
        setSuccessMsg(`Unit ${unitId} updated successfully.`);
      } else {
        await unitsService.createUnit({
          unit_id: unitId,
          unit_type: unitType,
          product_profile_id: productProfileId,
          safe_temp_min: safeMin,
          safe_temp_max: safeMax,
          initial_temp: initialTemp,
          initial_humidity: initialHumidity,
          cooling_capacity: coolingCapacity,
          initial_spoilage: initialSpoilage,
          ambient_temp: ambientTemp,
          ambient_humidity: ambientHumidity,
        });
        setSuccessMsg(`New unit ${unitId} commissioned successfully.`);
      }

      setModalOpen(false);
      await loadData();
      await refreshUnits();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save cold-chain unit.');
    }
  };

  const handleDelete = async (id: number, uId: string) => {
    if (!window.confirm(`Are you sure you want to decommission unit ${uId}?`)) return;
    try {
      await unitsService.deleteUnit(id);
      setSuccessMsg(`Unit ${uId} decommissioned.`);
      await loadData();
      await refreshUnits();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to delete unit.');
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <Navbar
        pageTitle="UNIT MANAGEMENT"
        subtitle="Configure Physical Unit Topologies, Safe Ranges & Product Sensitivities (No Charts)"
      />

      <div className="p-6 space-y-6">
        {/* Actions & Alerts */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Fleet Configuration Matrix</h3>
            <p className="text-xs text-slate-500">
              Manage multi-compartment refrigerated assets, thermodynamics, and perishable biological boundaries
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Commission New Unit</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Units Configuration Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Unit ID</th>
                  <th className="py-3 px-4">Asset Type</th>
                  <th className="py-3 px-4">Product Profile</th>
                  <th className="py-3 px-4">Safe Temp Band</th>
                  <th className="py-3 px-4">Current Temp</th>
                  <th className="py-3 px-4">Cooling Power</th>
                  <th className="py-3 px-4">Ambient Cond.</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      Loading unit configurations...
                    </td>
                  </tr>
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      No units configured. Click "Commission New Unit" to add.
                    </td>
                  </tr>
                ) : (
                  units.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 mono-num">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          {u.unit_id}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">{u.unit_type}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {u.product_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 mono-num font-semibold text-slate-800">
                        {u.safe_temp_min}°C to {u.safe_temp_max}°C
                      </td>
                      <td className="py-3 px-4 mono-num font-bold text-slate-900">
                        {u.current_temp.toFixed(2)} °C
                      </td>
                      <td className="py-3 px-4 mono-num text-slate-600">{u.cooling_capacity} %</td>
                      <td className="py-3 px-4 text-slate-500 mono-num">
                        {u.ambient_temp}°C / {u.ambient_humidity}%
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedViewUnit(u)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="View Full Physics Specs"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit Parameters"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.unit_id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Decommission Unit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Commission / Edit Unit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editUnitId ? `Edit Unit (${unitId})` : 'Commission New Cold-Chain Unit'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Identifier</label>
                  <input
                    type="text"
                    required
                    disabled={!!editUnitId}
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    placeholder="e.g. CON-03"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Type</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Primary Cold Warehouse">Primary Cold Warehouse</option>
                    <option value="Reefer Container (ISO-40ft)">Reefer Container (ISO-40ft)</option>
                    <option value="Reefer Container (ISO-20ft)">Reefer Container (ISO-20ft)</option>
                    <option value="Refrigerated Transit Vehicle">Refrigerated Transit Vehicle</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Profile</label>
                  <select
                    value={productProfileId}
                    onChange={(e) => handleProductChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.safe_temp_min}°C to {p.safe_temp_max}°C)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cooling Capacity (%)</label>
                  <input
                    type="number"
                    step="5"
                    min="20"
                    max="150"
                    value={coolingCapacity}
                    onChange={(e) => setCoolingCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Safe Min Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={safeMin}
                    onChange={(e) => setSafeMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Safe Max Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={safeMax}
                    onChange={(e) => setSafeMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {!editUnitId && (
                  <>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Initial Temp (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={initialTemp}
                        onChange={(e) => setInitialTemp(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Initial Humidity (%)</label>
                      <input
                        type="number"
                        step="1"
                        value={initialHumidity}
                        onChange={(e) => setInitialHumidity(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ambient Temp (°C)</label>
                  <input
                    type="number"
                    step="1"
                    value={ambientTemp}
                    onChange={(e) => setAmbientTemp(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ambient Humidity (%)</label>
                  <input
                    type="number"
                    step="1"
                    value={ambientHumidity}
                    onChange={(e) => setAmbientHumidity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 mono-num focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {editUnitId ? 'Save Configuration' : 'Commission Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Detail Modal */}
      {selectedViewUnit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedViewUnit.unit_id.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Unit Specifications: {selectedViewUnit.unit_id}</h3>
                  <span className="text-[11px] text-slate-500">{selectedViewUnit.unit_type}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedViewUnit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Active Cargo</span>
                  <p className="font-bold text-slate-800">{selectedViewUnit.product_name}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Status</span>
                  <div><StatusBadge status={selectedViewUnit.status} /></div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Current Temperature</span>
                  <p className="font-bold text-slate-800 mono-num">{selectedViewUnit.current_temp.toFixed(2)} °C</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Safe Thermal Band</span>
                  <p className="font-bold text-slate-800 mono-num">{selectedViewUnit.safe_temp_min}°C to {selectedViewUnit.safe_temp_max}°C</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Spoilage Index</span>
                  <p className="font-bold text-rose-600 mono-num">{Math.min(100, Math.max(0, selectedViewUnit.current_spoilage)).toFixed(2)} %</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Total Energy</span>
                  <p className="font-bold text-amber-600 mono-num">{selectedViewUnit.current_energy.toFixed(2)} kWh</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Compressor Rating</span>
                  <p className="font-bold text-slate-800 mono-num">{selectedViewUnit.cooling_capacity}% Nominal</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Ambient Environment</span>
                  <p className="font-bold text-slate-800 mono-num">{selectedViewUnit.ambient_temp}°C / {selectedViewUnit.ambient_humidity}% RH</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedViewUnit(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close Specification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

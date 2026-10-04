/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Equipment, EquipmentMaintenance } from "../types";
import { getDb, saveDb, logAction, addNotification } from "../db/mockDb";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Wrench,
  DollarSign,
  Briefcase,
  Layers,
  MapPin,
  ShieldCheck,
  Calendar,
  AlertTriangle
} from "lucide-react";

interface EquipmentManagementProps {
  currentUser: { email: string; role: string };
  searchTerm: string;
}

export default function EquipmentManagement({ currentUser, searchTerm }: EquipmentManagementProps) {
  const [db, setDb] = useState(getDb());
  const [searchLocal, setSearchLocal] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string>("All");

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEquipId, setCurrentEquipId] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Cardio (Treadmill, Elliptical)");
  const [formPurchaseDate, setFormPurchaseDate] = useState("");
  const [formPrice, setFormPrice] = useState(1200);
  const [formQty, setFormQty] = useState(1);
  const [formSupplier, setFormSupplier] = useState("Life Fitness Corp");
  const [formWarranty, setFormWarranty] = useState(24);
  const [formCondition, setFormCondition] = useState<Equipment["condition"]>("Excellent");
  const [formStatus, setFormStatus] = useState<Equipment["status"]>("Active");
  const [formLocation, setFormLocation] = useState("Cardio Zone");

  // Maintenance Logger drawer state
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintEquipId, setMaintEquipId] = useState("");
  const [maintDesc, setMaintDesc] = useState("");
  const [maintCost, setMaintCost] = useState(150);
  const [maintTech, setMaintTech] = useState("Certified Tech Support");

  const activeSearch = searchLocal || searchTerm;

  // Filter Equipment
  const filteredEquip = db.equipment.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      e.category.toLowerCase().includes(activeSearch.toLowerCase()) ||
      e.supplier.toLowerCase().includes(activeSearch.toLowerCase()) ||
      e.id.toLowerCase().includes(activeSearch.toLowerCase());

    const matchesCondition = conditionFilter === "All" || e.condition === conditionFilter;

    return matchesSearch && matchesCondition;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb = getDb();

    if (isEditing) {
      updatedDb.equipment = updatedDb.equipment.map(eq => {
        if (eq.id === currentEquipId) {
          return {
            ...eq,
            name: formName,
            category: formCategory,
            purchaseDate: formPurchaseDate,
            purchasePrice: formPrice,
            quantity: formQty,
            supplier: formSupplier,
            warrantyMonths: formWarranty,
            condition: formCondition,
            status: formStatus,
            location: formLocation
          };
        }
        return eq;
      });

      logAction(currentUser.email, currentUser.role as any, "Updated Equipment Asset", `Modified asset records for ${formName} (${currentEquipId})`);
    } else {
      const newId = `EQP-${String(updatedDb.equipment.length + 1).padStart(3, "0")}`;
      const newAsset: Equipment = {
        id: newId,
        name: formName,
        category: formCategory,
        purchaseDate: formPurchaseDate || new Date().toISOString().split("T")[0],
        purchasePrice: formPrice,
        quantity: formQty,
        supplier: formSupplier,
        warrantyMonths: formWarranty,
        condition: formCondition,
        maintenanceDate: new Date().toISOString().split("T")[0],
        status: formStatus,
        location: formLocation
      };

      updatedDb.equipment.push(newAsset);
      logAction(currentUser.email, currentUser.role as any, "Added New Gym Equipment", `Logged asset ${formName} (${newId}) under ${formCategory}`);
    }

    saveDb(updatedDb);
    setDb(updatedDb);
    setShowModal(false);
  };

  const handleDeleteEquip = (id: string, name: string) => {
    if (confirm(`Are you sure you want to retire/delete asset ${name} (${id})?`)) {
      const updatedDb = getDb();
      updatedDb.equipment = updatedDb.equipment.filter(eq => eq.id !== id);
      updatedDb.maintenance = updatedDb.maintenance.filter(m => m.equipmentId !== id);

      logAction(currentUser.email, currentUser.role as any, "Retired Equipment Asset", `Removed asset ${name} from active inventory`);
      saveDb(updatedDb);
      setDb(updatedDb);
    }
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb = getDb();

    const eq = updatedDb.equipment.find(item => item.id === maintEquipId);
    if (!eq) return;

    const maintenanceDate = new Date().toISOString().split("T")[0];
    const newMaint: EquipmentMaintenance = {
      id: `MNT-${Date.now()}-${db.maintenance.length + 1}`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      maintenanceDate,
      description: maintDesc,
      cost: maintCost,
      performedBy: maintTech
    };

    updatedDb.maintenance.unshift(newMaint);

    // Update equipment status to Under Maintenance or Good
    updatedDb.equipment = updatedDb.equipment.map(item => {
      if (item.id === eq.id) {
        return {
          ...item,
          condition: "Under Maintenance" as const,
          maintenanceDate,
          status: "Retired" as const // Locks the machine
        };
      }
      return item;
    });

    logAction(
      currentUser.email,
      currentUser.role as any,
      "Logged Equipment Maintenance",
      `Scheduled service for ${eq.name} costing $${maintCost}`
    );
    addNotification("Equipment Servicing Scheduled", `Asset ${eq.name} has been taken offline for service/tuning.`, "Equipment");

    saveDb(updatedDb);
    setDb(updatedDb);
    setShowMaintModal(false);
  };

  const handleResolveMaintenance = (id: string, name: string) => {
    if (confirm(`Confirm maintenance has been fully completed and resolved for ${name}? The machine will be returned to Good standing.`)) {
      const updatedDb = getDb();
      updatedDb.equipment = updatedDb.equipment.map(eq => {
        if (eq.id === id) {
          return {
            ...eq,
            condition: "Excellent" as const,
            status: "Active" as const
          };
        }
        return eq;
      });

      logAction(currentUser.email, currentUser.role as any, "Completed Asset Servicing", `Restored ${name} to active gym floor.`);
      addNotification("Equipment Servicing Completed", `Asset ${name} is back online on the gym floor.`, "Equipment");

      saveDb(updatedDb);
      setDb(updatedDb);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Equipment Inventory</h1>
          <p className="text-xs text-zinc-500 mt-1">Track warranty timelines, purchase values, locations, and mechanical standouts.</p>
        </div>

        {currentUser.role === "Administrator" && (
          <button
            id="add-equip-btn"
            onClick={() => {
              setIsEditing(false);
              setCurrentEquipId("");
              setFormName("");
              setFormCategory("Cardio (Treadmill, Elliptical)");
              setFormPurchaseDate(new Date().toISOString().split("T")[0]);
              setFormPrice(1500);
              setFormQty(1);
              setFormSupplier("Life Fitness Corp");
              setFormWarranty(24);
              setFormCondition("Excellent");
              setFormStatus("Active");
              setFormLocation("Cardio Zone");
              setShowModal(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Add New Asset
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchLocal}
            onChange={(e) => setSearchLocal(e.target.value)}
            className="pl-9 pr-4 block w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-xs bg-zinc-50/50"
            placeholder="Search assets by name, supplier, category, serial code..."
          />
        </div>

        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
        >
          <option value="All">All Conditions</option>
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Damaged">Damaged</option>
          <option value="Under Maintenance">Under Maintenance</option>
        </select>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquip.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-zinc-200 col-span-full text-zinc-500">
            No equipment assets matching selected filters.
          </div>
        ) : (
          filteredEquip.map(e => {
            const isCritical = e.condition === "Damaged" || e.condition === "Under Maintenance";
            return (
              <div key={e.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                      QTY: {e.quantity}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      e.condition === "Excellent" || e.condition === "Good" ? "bg-green-50 text-green-700" :
                      e.condition === "Fair" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    }`}>
                      {e.condition}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-zinc-800 text-sm mt-3.5 leading-snug">{e.name}</h3>
                  <p className="text-[11px] text-zinc-400 font-medium mt-1">{e.category}</p>

                  {/* Pricing and Location */}
                  <div className="grid grid-cols-2 gap-3 mt-4 border-t border-b border-zinc-100 py-3.5 my-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-zinc-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-zinc-400 font-medium">Value Price</p>
                        <p className="font-extrabold text-zinc-800 mt-0.5">${(e.purchasePrice * e.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-zinc-400 font-medium">Floor Location</p>
                        <p className="font-bold text-zinc-700 mt-0.5 truncate max-w-[80px]">{e.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-xs text-zinc-600 font-semibold">
                    <p className="flex justify-between">
                      <span className="text-zinc-400">Supplier:</span>
                      <span className="text-zinc-800">{e.supplier}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-400">Warranty:</span>
                      <span className="text-zinc-800">{e.warrantyMonths} Months</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-400">Last Serviced:</span>
                      <span className="text-zinc-600">{e.maintenanceDate}</span>
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-500">Asset: {e.id}</span>

                  {currentUser.role === "Administrator" && (
                    <div className="flex gap-1.5">
                      {e.condition === "Under Maintenance" ? (
                        <button
                          onClick={() => handleResolveMaintenance(e.id, e.name)}
                          className="px-2.5 py-1 text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition"
                        >
                          Mark Solved
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setMaintEquipId(e.id);
                            setMaintDesc("");
                            setShowMaintModal(true);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-zinc-200 transition"
                          title="Schedule Maintenance"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setCurrentEquipId(e.id);
                          setFormName(e.name);
                          setFormCategory(e.category);
                          setFormPurchaseDate(e.purchaseDate);
                          setFormPrice(e.purchasePrice);
                          setFormQty(e.quantity);
                          setFormSupplier(e.supplier);
                          setFormWarranty(e.warrantyMonths);
                          setFormCondition(e.condition);
                          setFormStatus(e.status);
                          setFormLocation(e.location);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-zinc-200 transition"
                        title="Edit Asset Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEquip(e.id, e.name)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-zinc-200 transition"
                        title="Retire Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Asset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl p-6 border border-zinc-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-lg font-extrabold text-zinc-800">
                {isEditing ? `Modify Asset: ${formName}` : "Register Gym Asset"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Equipment / Machine Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="Treadmill Integrity Series X"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Category Classification</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="Cardio (Treadmill, Elliptical)">Cardio (Treadmill, Elliptical)</option>
                    <option value="Strength (Machines)">Strength (Machines)</option>
                    <option value="Free Weights">Free Weights</option>
                    <option value="Functional (Kettlebells, Bands)">Functional (Kettlebells, Bands)</option>
                    <option value="Accessories (Mats, Rollers)">Accessories (Mats, Rollers)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={formPurchaseDate}
                    onChange={(e) => setFormPurchaseDate(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(parseInt(e.target.value) || 500)}
                      className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                      min="10"
                      max="15000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      value={formQty}
                      onChange={(e) => setFormQty(parseInt(e.target.value) || 1)}
                      className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Manufacturer Supplier</label>
                  <input
                    type="text"
                    required
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="Matrix Fitness USA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Warranty Term (Months)</label>
                  <input
                    type="number"
                    required
                    value={formWarranty}
                    onChange={(e) => setFormWarranty(parseInt(e.target.value) || 12)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    min="0"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Asset Location</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="Strength Zone, Cardio Area"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Mechanical Condition</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition"
                >
                  {isEditing ? "Save Changes" : "Register Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      {showMaintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 border border-zinc-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Log Asset Maintenance</h2>
              <button onClick={() => setShowMaintModal(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Issue / Service description</label>
                <textarea
                  required
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white h-20"
                  placeholder="e.g. Broken deck belt, calibration offset, squeaking gears..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Est. Cost ($)</label>
                  <input
                    type="number"
                    required
                    value={maintCost}
                    onChange={(e) => setMaintCost(parseInt(e.target.value) || 50)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Contractor / Tech</label>
                  <input
                    type="text"
                    required
                    value={maintTech}
                    onChange={(e) => setMaintTech(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  />
                </div>
              </div>

              <div className="bg-red-50 text-red-800 text-[10px] p-2.5 rounded-lg border border-red-100 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Scheduling maintenance takes the machine offline. It will be restricted in lists until a completed resolution flag is ticked.</span>
              </div>

              <div className="border-t border-zinc-100 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition"
                >
                  Confirm Service Lock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { MembershipPlan } from "../types";
import { getDb, saveDb, logAction, addNotification } from "../db/mockDb";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Award,
  Check,
  Power,
  TrendingUp,
  ChevronRight
} from "lucide-react";

interface MembershipPlansProps {
  currentUser: { email: string; role: string };
}

export default function MembershipPlans({ currentUser }: MembershipPlansProps) {
  const [db, setDb] = useState(getDb());
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState("");

  const [formName, setFormName] = useState("");
  const [formDuration, setFormDuration] = useState(30);
  const [formPrice, setFormPrice] = useState(60);
  const [formDesc, setFormDesc] = useState("");
  const [formFeatures, setFormFeatures] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState(true);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentPlanId("");
    setFormName("");
    setFormDuration(30);
    setFormPrice(60);
    setFormDesc("");
    setFormFeatures("Locker access, All gym equipment, Unlimited classes");
    setFormIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (p: MembershipPlan) => {
    setIsEditing(true);
    setCurrentPlanId(p.id);
    setFormName(p.name);
    setFormDuration(p.durationInDays);
    setFormPrice(p.price);
    setFormDesc(p.description);
    setFormFeatures(p.features.join(", "));
    setFormIsActive(p.isActive);
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb = getDb();
    const featuresArray = formFeatures.split(",").map(f => f.trim()).filter(f => f.length > 0);

    if (isEditing) {
      updatedDb.plans = updatedDb.plans.map(p => {
        if (p.id === currentPlanId) {
          return {
            ...p,
            name: formName,
            durationInDays: formDuration,
            price: formPrice,
            description: formDesc,
            features: featuresArray,
            isActive: formIsActive
          };
        }
        return p;
      });
      logAction(currentUser.email, currentUser.role as any, "Modified Membership Plan", `Updated configurations for ${formName} (${currentPlanId})`);
    } else {
      const newId = `PLAN-${String(updatedDb.plans.length + 1).padStart(3, "0")}`;
      const newPlan: MembershipPlan = {
        id: newId,
        name: formName,
        durationInDays: formDuration,
        price: formPrice,
        description: formDesc,
        features: featuresArray,
        isActive: formIsActive
      };
      updatedDb.plans.push(newPlan);
      logAction(currentUser.email, currentUser.role as any, "Created Membership Plan", `Launched new membership tier: ${formName} at $${formPrice}`);
      addNotification("New Membership Plan Launched", `Plan ${formName} is now active and available for enrollment at $${formPrice}.`, "General");
    }

    saveDb(updatedDb);
    setDb(updatedDb);
    setShowModal(false);
  };

  const togglePlanActive = (id: string, name: string, currentlyActive: boolean) => {
    const updatedDb = getDb();
    updatedDb.plans = updatedDb.plans.map(p => {
      if (p.id === id) {
        return { ...p, isActive: !currentlyActive };
      }
      return p;
    });

    logAction(currentUser.email, currentUser.role as any, currentlyActive ? "Deactivated Plan" : "Activated Plan", `Toggled availability of ${name}`);
    saveDb(updatedDb);
    setDb(updatedDb);
  };

  const handleDeletePlan = (id: string, name: string) => {
    const updatedDb = getDb();
    const membersOnPlan = updatedDb.members.filter(m => m.membershipPlanId === id).length;

    if (membersOnPlan > 0) {
      alert(`Cannot delete plan ${name} because there are currently ${membersOnPlan} members enrolled. Please migrate them to other plans first.`);
      return;
    }

    if (confirm(`Are you sure you want to delete plan ${name}?`)) {
      updatedDb.plans = updatedDb.plans.filter(p => p.id !== id);
      logAction(currentUser.email, currentUser.role as any, "Deleted Membership Plan", `Removed tier ${name} (${id})`);
      saveDb(updatedDb);
      setDb(updatedDb);
    }
  };

  return (
    <div className="space-y-6">
      {/* Block Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Membership Tier Tiers</h1>
          <p className="text-xs text-zinc-500 mt-1">Configure duration codes, pricing sheets, and promotional benefits checklists.</p>
        </div>

        {currentUser.role === "Administrator" && (
          <button
            id="add-plan-btn"
            onClick={openAddModal}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Add New Plan
          </button>
        )}
      </div>

      {/* Grid displaying plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.plans.map(p => {
          const membersEnrolled = db.members.filter(m => m.membershipPlanId === p.id).length;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col justify-between transition hover:shadow-md ${
                !p.isActive ? "opacity-60 bg-zinc-50/50" : ""
              }`}
            >
              {/* Plan Header */}
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                    {p.durationInDays} Days
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    p.isActive ? "bg-green-50 text-green-700" : "bg-zinc-200 text-zinc-600"
                  }`}>
                    {p.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
                
                <h3 className="font-extrabold text-zinc-800 text-base mt-3">{p.name}</h3>
                <p className="text-xs text-zinc-500 mt-1 h-10 overflow-hidden line-clamp-2">{p.description}</p>

                <div className="mt-4 flex items-baseline gap-1 text-zinc-900 font-extrabold text-2xl">
                  ${p.price} <span className="text-xs text-zinc-500 font-medium">/{p.durationInDays} Days</span>
                </div>

                {/* Features divider list */}
                <div className="border-t border-zinc-100 mt-4 pt-4 space-y-2 h-36 overflow-y-auto">
                  {p.features.map((feat, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-zinc-600 font-medium">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plan Footer details */}
              <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">
                  Enrolled: <span className="text-zinc-800 font-extrabold">{membersEnrolled} members</span>
                </span>

                {currentUser.role === "Administrator" && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => togglePlanActive(p.id, p.name, p.isActive)}
                      className={`p-1.5 rounded transition border border-transparent hover:border-zinc-200 ${
                        p.isActive ? "text-red-600 hover:bg-white" : "text-green-600 hover:bg-white"
                      }`}
                      title={p.isActive ? "Deactivate Plan" : "Activate Plan"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-zinc-200 transition"
                      title="Edit Plan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p.id, p.name)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-zinc-200 transition"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-zinc-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-lg font-extrabold text-zinc-800">
                {isEditing ? `Edit Plan: ${formName}` : "Create Membership Plan"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  placeholder="Premium Annual Elite"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 30)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    min="1"
                    max="1000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseInt(e.target.value) || 60)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    min="1"
                    max="5000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white h-20"
                  placeholder="Short marketing outline of benefits..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Benefits Features (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  placeholder="Locker access, Pool vouchers, Free personal training"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">Separating benefits with commas formats them as bullet points in our listing.</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="form-isactive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <label htmlFor="form-isactive" className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Plan Active on Launch</label>
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
                  {isEditing ? "Save Changes" : "Launch Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { getDb, saveDb, logAction, addNotification } from "../db/mockDb";
import { Settings, Shield, Key, CheckCircle2, User, Landmark, HelpCircle } from "lucide-react";

interface SettingsViewProps {
  currentUser: { email: string; role: string; id: string };
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
}

export default function SettingsView({ currentUser, setCurrentUser }: SettingsViewProps) {
  const [db, setDb] = useState(getDb());
  const [successMsg, setSuccessMsg] = useState("");

  // Profile fields
  const [formName, setFormName] = useState(() => {
    if (currentUser.role === "Member") {
      return db.members.find(m => m.email.toLowerCase() === currentUser.email.toLowerCase())?.fullName || "Gym Member";
    } else if (currentUser.role === "Trainer") {
      return db.trainers.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase())?.fullName || "Gym Coach";
    }
    return "Gym Administrator";
  });

  const [formPhone, setFormPhone] = useState(() => {
    if (currentUser.role === "Member") {
      return db.members.find(m => m.email.toLowerCase() === currentUser.email.toLowerCase())?.phone || "555-0199";
    } else if (currentUser.role === "Trainer") {
      return db.trainers.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase())?.phone || "555-0188";
    }
    return "555-0100";
  });

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // System parameters (Admin only)
  const [taxRate, setTaxRate] = useState(8);
  const [currency, setCurrency] = useState("USD ($)");
  const [gracePeriod, setGracePeriod] = useState(7);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb = getDb();

    if (currentUser.role === "Member") {
      updatedDb.members = updatedDb.members.map(m => {
        if (m.email.toLowerCase() === currentUser.email.toLowerCase()) {
          return { ...m, fullName: formName, phone: formPhone };
        }
        return m;
      });
    } else if (currentUser.role === "Trainer") {
      updatedDb.trainers = updatedDb.trainers.map(t => {
        if (t.email.toLowerCase() === currentUser.email.toLowerCase()) {
          return { ...t, fullName: formName, phone: formPhone };
        }
        return t;
      });
    }

    logAction(currentUser.email, currentUser.role as any, "Modified Account Profile", `Updated display name to ${formName}`);
    saveDb(updatedDb);
    setDb(updatedDb);

    // Update global state
    setCurrentUser(prev => ({ ...prev, name: formName }));

    setSuccessMsg("Profile information updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    logAction(currentUser.email, currentUser.role as any, "Reset Account Password", "Simulated password credentials update");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setSuccessMsg("Security credentials reset successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleSaveSystemConfig = (e: React.FormEvent) => {
    e.preventDefault();
    logAction(currentUser.email, currentUser.role as any, "Modified Gym Settings", "Updated pricing metrics");
    setSuccessMsg("Gym parameters updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-zinc-500 mt-1">Configure profile preferences, security passwords, and core organizational coordinates.</p>
      </div>

      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 text-xs text-green-700 rounded-r-md font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-6 space-y-4">
          <h3 className="font-extrabold text-zinc-800 text-sm flex items-center gap-2 pb-3 border-b border-zinc-100">
            <User className="w-4 h-4 text-red-600" /> Account Information
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Full Display Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Registered Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="block w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-500 bg-zinc-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
              />
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition"
            >
              Save Profile Details
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-6 space-y-4">
          <h3 className="font-extrabold text-zinc-800 text-sm flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Key className="w-4 h-4 text-red-600" /> Reset Password
          </h3>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                placeholder="Min 8 characters..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                placeholder="Re-enter password..."
              />
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition"
            >
              Update Credentials
            </button>
          </form>
        </div>

        {/* Admin parameters configuration panel */}
        {currentUser.role === "Administrator" && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-6 space-y-4 lg:col-span-2">
            <h3 className="font-extrabold text-zinc-800 text-sm flex items-center gap-2 pb-3 border-b border-zinc-100">
              <Landmark className="w-4 h-4 text-red-600" /> Comfort Gym Operational Parameters
            </h3>

            <form onSubmit={handleSaveSystemConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Invoice Sales Tax Rate (%)</label>
                <input
                  type="number"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseInt(e.target.value) || 8)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Currency Code Symbol</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                  <option value="CAD ($)">CAD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Active Grace Period (Days)</label>
                <input
                  type="number"
                  required
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(parseInt(e.target.value) || 7)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition"
                >
                  Save Gym System Configs
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

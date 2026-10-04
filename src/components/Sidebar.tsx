/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UserRole } from "../types";
import {
  Dumbbell,
  Users,
  Award,
  DollarSign,
  Calendar,
  Wrench,
  CheckSquare,
  FileText,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  userName: string;
}

export default function Sidebar({
  currentRole,
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  onLogout,
  userName
}: SidebarProps) {
  // Define menu items for Administrator
  const adminItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "members", label: "Members", icon: Users },
    { id: "trainers", label: "Trainers", icon: Award },
    { id: "plans", label: "Membership Plans", icon: FileText },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "classes", label: "Fitness Classes", icon: Calendar },
    { id: "equipment", label: "Equipment", icon: Wrench },
    { id: "attendance", label: "Attendance", icon: CheckSquare },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "audit", label: "Audit Log", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  // Define menu items for Trainer
  const trainerItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "classes", label: "My Classes", icon: Calendar },
    { id: "attendance", label: "Record Attendance", icon: CheckSquare },
    { id: "members", label: "View Members", icon: Users },
    { id: "settings", label: "My Profile", icon: Settings }
  ];

  // Define menu items for Member
  const memberItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "plans", label: "Membership Plans", icon: FileText },
    { id: "payments", label: "Payment History", icon: DollarSign },
    { id: "classes", label: "Join Classes", icon: Calendar },
    { id: "attendance", label: "My Attendance", icon: CheckSquare },
    { id: "settings", label: "My Profile", icon: Settings }
  ];

  // Pick items based on role
  const menuItems = 
    currentRole === "Administrator" 
      ? adminItems 
      : currentRole === "Trainer" 
        ? trainerItems 
        : memberItems;

  return (
    <aside
      id="sidebar"
      className={`bg-zinc-900 text-zinc-100 flex flex-col justify-between h-screen sticky top-0 transition-all duration-300 border-r border-zinc-800 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div>
        {/* Header Logo */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 h-16">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-red-600 p-1.5 rounded-lg text-white shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-white whitespace-nowrap tracking-wide">
                Comfort Gym
              </span>
            )}
          </div>
          <button
            id="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition md:block hidden"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Quick Info */}
        {!collapsed && (
          <div className="p-4 border-b border-zinc-800 bg-zinc-950/40">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Logged in as</p>
            <p className="font-bold text-white text-sm truncate mt-0.5">{userName}</p>
            <span className="inline-block bg-red-950 text-red-400 border border-red-900 text-[10px] px-1.5 py-0.5 rounded-md font-semibold mt-1">
              {currentRole}
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group ${
                  isActive
                    ? "bg-red-600 text-white font-semibold shadow-md shadow-red-900/10"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-2 border-t border-zinc-800">
        <button
          id="logout-btn"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0 text-zinc-400" />
          {!collapsed && <span className="truncate font-semibold">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, UserRole, SystemNotification } from "../types";
import { getDb, saveDb, logAction } from "../db/mockDb";
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  X,
  Check
} from "lucide-react";

interface HeaderProps {
  currentUser: User;
  onRoleChange: (newRole: UserRole) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onLogout: () => void;
  setActiveTab: (tab: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function Header({
  currentUser,
  onRoleChange,
  darkMode,
  setDarkMode,
  onLogout,
  setActiveTab,
  searchTerm,
  setSearchTerm
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Get active system notifications
  const db = getDb();
  const notifications = db.notifications.filter(
    n => !n.targetUserId || n.targetUserId === currentUser.id
  );
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    const updatedDb = getDb();
    updatedDb.notifications = updatedDb.notifications.map(n => {
      if (!n.targetUserId || n.targetUserId === currentUser.id) {
        return { ...n, isRead: true };
      }
      return n;
    });
    saveDb(updatedDb);
    logAction(currentUser.email, currentUser.role, "Marked Notifications Read", "Marked all active system notifications as read.");
  };

  const deleteNotification = (id: string) => {
    const updatedDb = getDb();
    updatedDb.notifications = updatedDb.notifications.filter(n => n.id !== id);
    saveDb(updatedDb);
  };

  return (
    <header id="header" className="h-16 bg-white border-b border-zinc-200 sticky top-0 z-40 flex items-center justify-between px-6">
      {/* Left: Global Search */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="global-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 block w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm bg-zinc-50"
            placeholder="Search members, invoices, trainers..."
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Environment Role Override Pill (Great for AI Studio testers!) */}
        <div className="hidden md:flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Role Bypass:</span>
          <select
            id="role-switcher"
            value={currentUser.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="text-xs bg-transparent font-semibold text-zinc-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="Administrator">Admin</option>
            <option value="Trainer">Trainer</option>
            <option value="Member">Member</option>
          </select>
        </div>

        {/* Theme Toggle (Simulation for premium UI vibes) */}
        <button
          id="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notifications-bell"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span id="notif-badge" className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div id="notifications-panel" className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-800">Notifications ({notifications.length})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-red-600 font-semibold hover:text-red-500 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-zinc-100">
                {notifications.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">No recent notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-3 text-xs transition hover:bg-zinc-50 ${!n.isRead ? "bg-red-50/40" : ""}`}>
                      <div className="flex justify-between items-start">
                        <span className={`font-semibold ${!n.isRead ? "text-red-800" : "text-zinc-700"}`}>
                          {n.title}
                        </span>
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-zinc-600 mt-1">{n.message}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">{n.date}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            id="profile-dropdown"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 border border-red-200 font-bold uppercase">
              {currentUser.fullName.charAt(0)}
            </div>
            <span className="hidden md:block truncate max-w-[100px]">{currentUser.fullName}</span>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </button>

          {showProfileMenu && (
            <div id="profile-panel" className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl py-1 z-50">
              <div className="px-4 py-2 border-b border-zinc-100">
                <p className="font-bold text-zinc-800 text-xs truncate">{currentUser.fullName}</p>
                <p className="text-zinc-500 text-[10px] truncate mt-0.5">{currentUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-zinc-400" /> My Profile / Settings
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-zinc-100 flex items-center gap-2 font-semibold"
              >
                <LogOut className="w-4 h-4 text-red-400" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

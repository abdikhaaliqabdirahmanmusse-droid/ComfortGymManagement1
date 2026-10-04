/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, UserRole } from "./types";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import MemberManagement from "./components/MemberManagement";
import TrainerManagement from "./components/TrainerManagement";
import MembershipPlans from "./components/MembershipPlans";
import PaymentModule from "./components/PaymentModule";
import FitnessClasses from "./components/FitnessClasses";
import AttendanceManagement from "./components/AttendanceManagement";
import EquipmentManagement from "./components/EquipmentManagement";
import Reports from "./components/Reports";
import AuditLogView from "./components/AuditLogView";
import SettingsView from "./components/SettingsView";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className={`flex h-screen overflow-hidden text-zinc-900 font-sans print:bg-white print:h-auto print:overflow-visible ${darkMode ? "dark bg-zinc-950 text-zinc-100" : "bg-zinc-50"}`}>
      {/* Sidebar Navigation - Hidden in print mode */}
      <div className="print:hidden h-full">
        <Sidebar
          currentRole={currentUser.role}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setGlobalSearchTerm(""); // Reset search on tab switch
          }}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onLogout={() => setCurrentUser(null)}
          userName={currentUser.fullName}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto print:overflow-visible">
        {/* Header - Hidden in print mode */}
        <div className="print:hidden shrink-0">
          <Header
            currentUser={currentUser}
            onRoleChange={(newRole) => {
              setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
            }}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onLogout={() => setCurrentUser(null)}
            setActiveTab={setActiveTab}
            searchTerm={globalSearchTerm}
            setSearchTerm={setGlobalSearchTerm}
          />
        </div>

        {/* Dashboard Panels */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto print:p-0 print:max-w-none">
          {activeTab === "Dashboard" && (
            <Dashboard currentUser={currentUser} setActiveTab={setActiveTab} />
          )}

          {activeTab === "Members" && (
            <MemberManagement currentUser={currentUser} searchTerm={globalSearchTerm} />
          )}

          {activeTab === "Trainers" && (
            <TrainerManagement currentUser={currentUser} searchTerm={globalSearchTerm} />
          )}

          {activeTab === "Plans" && (
            <MembershipPlans currentUser={currentUser} />
          )}

          {activeTab === "Payments" && (
            <PaymentModule currentUser={currentUser} searchTerm={globalSearchTerm} />
          )}

          {activeTab === "Classes" && (
            <FitnessClasses currentUser={currentUser} searchTerm={globalSearchTerm} />
          )}

          {activeTab === "Attendance" && (
            <AttendanceManagement currentUser={currentUser} searchTerm={globalSearchTerm} />
          )}

          {activeTab === "Equipment" && (
            <EquipmentManagement currentUser={currentUser} searchTerm={globalSearchTerm} />
          )}

          {activeTab === "Reports" && (
            <Reports currentUser={currentUser} />
          )}

          {activeTab === "Logs" && (
            <AuditLogView currentUser={currentUser} searchTerm={globalSearchTerm} />
          )}

          {activeTab === "Settings" && (
            <SettingsView currentUser={currentUser} setCurrentUser={setCurrentUser} />
          )}
        </main>
      </div>
    </div>
  );
}

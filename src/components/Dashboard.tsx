/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Member, Trainer, FitnessClass, Payment, Attendance } from "../types";
import { getDb, logAction } from "../db/mockDb";
import {
  Users,
  Award,
  Calendar,
  DollarSign,
  TrendingUp,
  Wrench,
  CheckSquare,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Dumbbell
} from "lucide-react";

interface DashboardProps {
  currentUser: User;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ currentUser, setActiveTab }: DashboardProps) {
  const db = getDb();

  // -----------------------------------------------------
  // STATS COMPUTATIONS
  // -----------------------------------------------------
  const totalMembers = db.members.length;
  const activeMembers = db.members.filter(m => m.status === "Active").length;
  const expiredMembers = db.members.filter(m => m.status === "Expired").length;
  const totalTrainers = db.trainers.length;
  const totalClasses = db.classes.length;
  
  // Today's attendance calculation
  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = db.attendance.filter(a => a.date === today);
  const todayAttendanceCount = todayAttendance.filter(a => a.isPresent).length;
  const todayTotalLogged = todayAttendance.length;
  
  // Monthly income
  const paidInvoices = db.payments.filter(p => p.status === "Paid");
  const monthlyIncome = paidInvoices.reduce((sum, p) => sum + p.totalAmount, 0);

  const equipmentCount = db.equipment.reduce((sum, e) => sum + e.quantity, 0);
  const activeMemberships = activeMembers;

  // Let's retrieve role-specific active records
  const getTrainerInfo = (): Trainer | undefined => {
    return db.trainers.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase()) || db.trainers[0];
  };

  const getMemberInfo = (): Member | undefined => {
    return db.members.find(m => m.email.toLowerCase() === currentUser.email.toLowerCase()) || db.members[0];
  };

  const trainer = getTrainerInfo();
  const member = getMemberInfo();

  // -----------------------------------------------------
  // RENDER ADMINISTRATOR DASHBOARD
  // -----------------------------------------------------
  const renderAdminDashboard = () => {
    // Chart Data Setup
    const revenueMonths = [
      { label: "Jan", revenue: 5600, signups: 15 },
      { label: "Feb", revenue: 6800, signups: 22 },
      { label: "Mar", revenue: 7500, signups: 30 },
      { label: "Apr", revenue: 8400, signups: 35 },
      { label: "May", revenue: 9900, signups: 42 },
      { label: "Jun", revenue: 11200, signups: 48 },
      { label: "Jul", revenue: monthlyIncome > 12000 ? monthlyIncome : 13400, signups: totalMembers }
    ];

    const planStats = db.plans.map(p => {
      const count = db.members.filter(m => m.membershipPlanId === p.id).length;
      return { name: p.name, count, price: p.price };
    });

    const maxRevenue = Math.max(...revenueMonths.map(d => d.revenue));
    const maxSignups = Math.max(...revenueMonths.map(d => d.signups));

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Comfort Gym Dashboard</h1>
            <p className="text-sm text-zinc-600">Enterprise operational monitoring and analytics.</p>
          </div>
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-red-500 animate-pulse" /> Comfort Sync Active
          </div>
        </div>

        {/* Operational Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div id="stat-total-members" className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between hover:border-red-200 transition">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Members</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 mt-1">{totalMembers}</h3>
              <p className="text-[11px] text-green-600 font-semibold mt-1">▲ 14% growth month-over-month</p>
            </div>
            <div className="p-3 bg-zinc-100 rounded-lg text-zinc-700">
              <Users className="w-6 h-6 text-zinc-600" />
            </div>
          </div>

          <div id="stat-active-members" className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between hover:border-red-200 transition">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Plans</p>
              <h3 className="text-2xl font-extrabold text-green-600 mt-1">{activeMembers}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">{expiredMembers} expired records</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>

          <div id="stat-monthly-income" className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between hover:border-red-200 transition">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Gross Revenue</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 mt-1">${monthlyIncome.toLocaleString()}</h3>
              <p className="text-[11px] text-green-600 font-semibold mt-1">▲ $3,120 newly received</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-red-600">
              <DollarSign className="w-6 h-6 text-red-500" />
            </div>
          </div>

          <div id="stat-today-attendance" className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between hover:border-red-200 transition">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Today's Presence</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 mt-1">
                {todayTotalLogged > 0 ? `${todayAttendanceCount}/${todayTotalLogged}` : "143"}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">Avg 92% attendance rate</p>
            </div>
            <div className="p-3 bg-zinc-100 rounded-lg text-zinc-700">
              <CheckSquare className="w-6 h-6 text-zinc-600" />
            </div>
          </div>
        </div>

        {/* Extra Admin metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-center">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Trainers</span>
            <span className="text-xl font-bold text-zinc-800 mt-1 block">{totalTrainers}</span>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-center">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Fitness Classes</span>
            <span className="text-xl font-bold text-zinc-800 mt-1 block">{totalClasses}</span>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-center">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Equipment Units</span>
            <span className="text-xl font-bold text-zinc-800 mt-1 block">{equipmentCount}</span>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl text-center">
            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Active Memberships</span>
            <span className="text-xl font-bold text-zinc-800 mt-1 block">{activeMemberships}</span>
          </div>
        </div>

        {/* Analytical Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div id="chart-revenue" className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" /> Revenue Growth Trend
            </h3>
            <div className="h-64 relative">
              {/* Custom SVG Line Chart */}
              <svg className="w-full h-full" viewBox="0 0 500 220">
                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                  <line
                    key={i}
                    x1="40"
                    y1={20 + ratio * 160}
                    x2="480"
                    y2={20 + ratio * 160}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                ))}
                {/* Chart Line Path */}
                <path
                  d={revenueMonths
                    .map((d, i) => {
                      const x = 50 + (i * 410) / (revenueMonths.length - 1);
                      const y = 180 - (d.revenue / maxRevenue) * 140;
                      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Gradient area under the line */}
                <path
                  d={
                    revenueMonths
                      .map((d, i) => {
                        const x = 50 + (i * 410) / (revenueMonths.length - 1);
                        const y = 180 - (d.revenue / maxRevenue) * 140;
                        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                      })
                      .join(" ") +
                    ` L 460 180 L 50 180 Z`
                  }
                  fill="url(#revenue-grad)"
                  opacity="0.12"
                />
                {/* Data points */}
                {revenueMonths.map((d, i) => {
                  const x = 50 + (i * 410) / (revenueMonths.length - 1);
                  const y = 180 - (d.revenue / maxRevenue) * 140;
                  return (
                    <g key={i} className="group">
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="cursor-pointer transition duration-200 transform group-hover:scale-150"
                      />
                      {/* Interactive hover values */}
                      <text
                        x={x}
                        y={y - 12}
                        textAnchor="middle"
                        className="opacity-0 group-hover:opacity-100 fill-zinc-800 font-bold text-[10px] transition duration-200"
                      >
                        ${d.revenue}
                      </text>
                    </g>
                  );
                })}
                {/* Month labels */}
                {revenueMonths.map((d, i) => {
                  const x = 50 + (i * 410) / (revenueMonths.length - 1);
                  return (
                    <text
                      key={i}
                      x={x}
                      y="205"
                      textAnchor="middle"
                      fill="#71717a"
                      className="text-[10px] font-semibold"
                    >
                      {d.label}
                    </text>
                  );
                })}
                {/* Left Y Axis values */}
                <text x="30" y="24" textAnchor="end" fill="#a1a1aa" className="text-[9px]">
                  $14k
                </text>
                <text x="30" y="94" textAnchor="end" fill="#a1a1aa" className="text-[9px]">
                  $7k
                </text>
                <text x="30" y="164" textAnchor="end" fill="#a1a1aa" className="text-[9px]">
                  $0
                </text>
                <defs>
                  <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex justify-center gap-6 mt-2 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Gross Revenue ($)
              </span>
            </div>
          </div>

          {/* Membership Distribution Donut Chart */}
          <div id="chart-membership-pie" className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4">
              Membership Tiers
            </h3>
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-44 h-44 mb-4">
                {/* SVG circular representation */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Outer circle track */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  {/* Segment A (Annual - 40%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="100.5" // 40% value
                  />
                  {/* Segment B (Monthly - 35%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="188.4" // 35% starting shifted
                    className="origin-center rotate-144"
                  />
                  {/* Segment C (Daily/Weekly - 25%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset="213.5" // 25% starting shifted
                    className="origin-center rotate-270"
                  />
                </svg>
                {/* Center metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-zinc-900">{totalMembers}</span>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Total</span>
                </div>
              </div>
              <div className="w-full space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-zinc-600 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Annual Plans
                  </span>
                  <span className="font-extrabold text-zinc-800">40%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-zinc-600 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Monthly Plans
                  </span>
                  <span className="font-extrabold text-zinc-800">35%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-zinc-600 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Daily & Weekly
                  </span>
                  <span className="font-extrabold text-zinc-800">25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Classes & Maintenance logs table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Scheduled Sessions Today</span>
              <button onClick={() => setActiveTab("classes")} className="text-xs text-red-600 hover:text-red-500 flex items-center gap-1 font-semibold">
                All classes <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </h3>
            <div className="divide-y divide-zinc-100">
              {db.classes.slice(0, 5).map(c => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-800">{c.name}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Trainer: {c.trainerName} | Room: {c.room}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-red-50 text-red-600 font-semibold text-xs px-2.5 py-1 rounded-md">
                      {c.startTime} - {c.endTime}
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-1">{c.schedule.slice(0, 2).join(", ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Equipment Maintenance Tracker</span>
              <button onClick={() => setActiveTab("equipment")} className="text-xs text-red-600 hover:text-red-500 flex items-center gap-1 font-semibold">
                Inventory <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </h3>
            <div className="divide-y divide-zinc-100">
              {db.equipment.filter(e => e.condition === "Under Maintenance" || e.condition === "Damaged").slice(0, 5).map(e => (
                <div key={e.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-800">{e.name}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">Category: {e.category} | Supplier: {e.supplier}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block font-semibold text-xs px-2.5 py-1 rounded-md ${
                      e.condition === "Damaged" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {e.condition}
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-1">Purchased: {e.purchaseDate}</p>
                  </div>
                </div>
              ))}
              {db.equipment.filter(e => e.condition === "Under Maintenance" || e.condition === "Damaged").length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-zinc-500">All fitness machines & equipment are currently in Excellent or Good standing!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------
  // RENDER TRAINER DASHBOARD
  // -----------------------------------------------------
  const renderTrainerDashboard = () => {
    if (!trainer) {
      return (
        <div className="text-center py-12">
          <p className="text-zinc-500">Loading trainer profile context...</p>
        </div>
      );
    }

    // Classes assigned to this trainer
    const assignedClasses = db.classes.filter(c => c.trainerId === trainer.id);
    const assignedClassIds = assignedClasses.map(c => c.id);

    // Filter attendance to classes of this trainer
    const trainerAttendance = db.attendance.filter(a => assignedClassIds.includes(a.classId));
    const trainerPresent = trainerAttendance.filter(a => a.isPresent).length;
    const trainerTotalAttendance = trainerAttendance.length;
    const attendancePercentage = trainerTotalAttendance > 0 
      ? Math.round((trainerPresent / trainerTotalAttendance) * 100) 
      : 95;

    // Members attending trainer's classes
    const trainerEnrollments = db.enrollments.filter(e => assignedClassIds.includes(e.classId));
    const uniqueMemberIds = Array.from(new Set(trainerEnrollments.map(e => e.memberId)));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Trainer Hub</h1>
          <p className="text-sm text-zinc-600">Assigned schedule, member logs, and session statistics for {trainer.fullName}.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">My Classes</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 mt-1">{assignedClasses.length}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Ongoing assigned slots</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-red-600">
              <Calendar className="w-6 h-6 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Members</p>
              <h3 className="text-2xl font-extrabold text-green-600 mt-1">{uniqueMemberIds.length}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Enrolled in your classes</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <Users className="w-6 h-6 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Avg Attendance</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 mt-1">{attendancePercentage}%</h3>
              <p className="text-[11px] text-zinc-500 mt-1">{trainerPresent} checks validated</p>
            </div>
            <div className="p-3 bg-zinc-100 rounded-lg text-zinc-700">
              <CheckSquare className="w-6 h-6 text-zinc-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Specialty</p>
              <h3 className="text-lg font-extrabold text-zinc-800 mt-1 truncate max-w-[150px]">{trainer.specialty}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">{trainer.experience} years of experience</p>
            </div>
            <div className="p-3 bg-zinc-100 rounded-lg text-zinc-700">
              <Award className="w-6 h-6 text-zinc-600" />
            </div>
          </div>
        </div>

        {/* Assigned Classes Schedule */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4">
            My Regular Weekly Schedule
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-zinc-500 uppercase">
                  <th className="pb-3">Class Name</th>
                  <th className="pb-3">Schedule Days</th>
                  <th className="pb-3">Hour</th>
                  <th className="pb-3">Room</th>
                  <th className="pb-3">Capacity</th>
                  <th className="pb-3">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {assignedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-zinc-500">
                      No classes assigned to you currently. Contact Admin to coordinate schedules.
                    </td>
                  </tr>
                ) : (
                  assignedClasses.map(c => (
                    <tr key={c.id} className="hover:bg-zinc-50/50">
                      <td className="py-3.5 font-semibold text-zinc-800">{c.name}</td>
                      <td className="py-3.5 text-zinc-600">{c.schedule.join(", ")}</td>
                      <td className="py-3.5 text-red-600 font-semibold">{c.startTime} - {c.endTime}</td>
                      <td className="py-3.5 text-zinc-500">{c.room}</td>
                      <td className="py-3.5 text-zinc-600">Limit: {c.capacity}</td>
                      <td className="py-3.5">
                        <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                          c.difficulty === "Beginner" ? "bg-green-50 text-green-700" :
                          c.difficulty === "Intermediate" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                        }`}>
                          {c.difficulty}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------
  // RENDER MEMBER DASHBOARD
  // -----------------------------------------------------
  const renderMemberDashboard = () => {
    if (!member) {
      return (
        <div className="text-center py-12">
          <p className="text-zinc-500">Loading member profile context...</p>
        </div>
      );
    }

    const plan = db.plans.find(p => p.id === member.membershipPlanId) || db.plans[0];
    const payments = db.payments.filter(p => p.memberId === member.id);
    const lastPayment = payments[0]; // sorted by invoice is typically newest

    // Member attendance
    const attendance = db.attendance.filter(a => a.memberId === member.id);
    const presenceCount = attendance.filter(a => a.isPresent).length;

    // Upcoming classes that the member can attend
    const enrolledClassIds = db.enrollments.filter(e => e.memberId === member.id).map(e => e.classId);
    const memberClasses = db.classes.filter(c => enrolledClassIds.includes(c.id));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Member Portal</h1>
          <p className="text-sm text-zinc-600">Access schedule, check membership status, view payments, and log fitness attendance.</p>
        </div>

        {/* Member Specific Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Plan Status</p>
              <h3 className={`text-2xl font-extrabold mt-1 ${member.status === "Active" ? "text-green-600" : "text-red-600"}`}>
                {member.status}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">{plan?.name || "No Active Plan"}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <Award className="w-6 h-6 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Billing Balance</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 mt-1">
                {lastPayment?.status === "Paid" ? "$0.00" : `$${plan?.price || "60.00"}`}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">
                {lastPayment?.status === "Paid" ? "All invoices settled" : "Due Date: " + (lastPayment?.dueDate || "Tomorrow")}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-red-600">
              <DollarSign className="w-6 h-6 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Sessions Attended</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 mt-1">{presenceCount}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">Active gym visits logged</p>
            </div>
            <div className="p-3 bg-zinc-100 rounded-lg text-zinc-700">
              <CheckSquare className="w-6 h-6 text-zinc-600" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">My Biometrics</p>
              <h3 className="text-lg font-extrabold text-zinc-800 mt-1">BMI: {member.bmi}</h3>
              <p className="text-[11px] text-zinc-500 mt-1">{member.height}cm / {member.weight}kg</p>
            </div>
            <div className="p-3 bg-zinc-100 rounded-lg text-zinc-700">
              <Dumbbell className="w-6 h-6 text-zinc-600" />
            </div>
          </div>
        </div>

        {/* Member Schedule / Enrolled Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>My Enrolled Weekly Classes</span>
              <button onClick={() => setActiveTab("classes")} className="text-xs text-red-600 hover:text-red-500 font-semibold flex items-center gap-1">
                Explore classes <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </h3>
            <div className="divide-y divide-zinc-100">
              {memberClasses.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-zinc-500">You are not currently enrolled in any recurring classes.</p>
                  <button onClick={() => setActiveTab("classes")} className="mt-3 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg">
                    Join A Fitness Class
                  </button>
                </div>
              ) : (
                memberClasses.map(c => (
                  <div key={c.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-800">{c.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Trainer: {c.trainerName} | Room: {c.room}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-red-50 text-red-600 font-bold text-xs px-2.5 py-1 rounded-md">
                        {c.startTime} - {c.endTime}
                      </span>
                      <p className="text-[10px] text-zinc-400 mt-1">{c.schedule.join(", ")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Membership Plan Features */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4">My Plan Details</h3>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Active membership</span>
                <h4 className="font-extrabold text-zinc-800 text-lg mt-2">{plan?.name}</h4>
                <p className="text-xs text-zinc-500 mt-1">{plan?.description}</p>
                <div className="mt-3 flex items-baseline gap-1 text-zinc-900 font-extrabold text-2xl">
                  ${plan?.price} <span className="text-xs text-zinc-500 font-medium">/{plan?.durationInDays} days</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-zinc-600 font-medium">
                {plan?.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-500">✔</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => setActiveTab("plans")} className="w-full mt-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 py-2.5 rounded-lg text-xs font-bold transition">
              Upgrade / Renew Membership
            </button>
          </div>
        </div>
      </div>
    );
  };

  switch (currentUser.role) {
    case "Administrator":
      return renderAdminDashboard();
    case "Trainer":
      return renderTrainerDashboard();
    case "Member":
      return renderMemberDashboard();
    default:
      return renderAdminDashboard();
  }
}

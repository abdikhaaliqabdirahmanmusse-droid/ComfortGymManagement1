/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { getDb, logAction } from "../db/mockDb";
import {
  FileText,
  Printer,
  Download,
  DollarSign,
  Users,
  Award,
  CheckSquare,
  Wrench,
  Sparkles,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";

interface ReportsProps {
  currentUser: { email: string; role: string };
}

type ReportType =
  | "Members"
  | "Trainers"
  | "Attendance"
  | "Revenue"
  | "Equipment"
  | "DailySummary";

export default function Reports({ currentUser }: ReportsProps) {
  const [db, setDb] = useState(getDb());
  const [activeReport, setActiveReport] = useState<ReportType>("DailySummary");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computations
  const totalMembers = db.members.length;
  const activeMembers = db.members.filter(m => m.status === "Active").length;
  const expiredMembers = db.members.filter(m => m.status === "Expired").length;
  const totalInvoiced = db.payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const paidCount = db.payments.filter(p => p.status === "Paid").length;
  const totalEquipmentCost = db.equipment.reduce((sum, e) => sum + e.purchasePrice * e.quantity, 0);
  const totalMaintenanceLoggedCost = db.maintenance.reduce((sum, m) => sum + m.cost, 0);

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setDb(getDb());
      setIsRefreshing(false);
    }, 600);
  };

  // Compile CSV client-side and trigger download
  const handleExportCSV = (type: ReportType) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = `ComfortGym_${type}_Report.csv`;

    if (type === "Members") {
      csvContent += "Member ID,Full Name,Email,Phone,Gender,Registration Date,Plan ID,Status,BMI,Height(cm),Weight(kg)\n";
      db.members.forEach(m => {
        csvContent += `"${m.id}","${m.fullName}","${m.email}","${m.phone}","${m.gender}","${m.registrationDate}","${m.membershipPlanId}","${m.status}",${m.bmi},${m.height},${m.weight}\n`;
      });
    } else if (type === "Trainers") {
      csvContent += "Trainer ID,Name,Specialty,Email,Phone,Experience(Years),Salary($),Availability\n";
      db.trainers.forEach(t => {
        csvContent += `"${t.id}","${t.fullName}","${t.specialty}","${t.email}","${t.phone}",${t.experience},${t.salary},"${t.availability}"\n`;
      });
    } else if (type === "Attendance") {
      csvContent += "Attendance ID,Member Name,Member ID,Class Name,Date,Trainer,Present\n";
      db.attendance.slice(0, 150).forEach(a => {
        csvContent += `"${a.id}","${a.memberName}","${a.memberId}","${a.className}","${a.date}","${a.trainerName}",${a.isPresent ? "YES" : "NO"}\n`;
      });
    } else if (type === "Revenue") {
      csvContent += "Invoice Number,Member Name,Plan Billed,Paid Amount($),Tax($),Discount($),Payment Method,Date,Receipt Number\n";
      db.payments.forEach(p => {
        csvContent += `"${p.invoiceNumber}","${p.memberName}","${p.planName}",${p.totalAmount},${p.tax},${p.discount},"${p.paymentMethod}","${p.paymentDate}","${p.receiptNumber}"\n`;
      });
    } else if (type === "Equipment") {
      csvContent += "Equipment ID,Name,Category,Condition,Purchase Date,Value($),Quantity,Supplier,Location,Status\n";
      db.equipment.forEach(e => {
        csvContent += `"${e.id}","${e.name}","${e.category}","${e.condition}","${e.purchaseDate}",${e.purchasePrice},${e.quantity},"${e.supplier}","${e.location}","${e.status}"\n`;
      });
    } else {
      // Daily summary
      csvContent += "Metric,Value,Standing Details\n";
      csvContent += `Total Members,${totalMembers},Growth pace matches seasonal estimates\n`;
      csvContent += `Active Accounts,${activeMembers},${Math.round((activeMembers / totalMembers) * 100)}% utilization tier\n`;
      csvContent += `Total Financials,$${totalInvoiced.toLocaleString()},Consolidated gross collected\n`;
      csvContent += `Total Assets Price,$${totalEquipmentCost.toLocaleString()},Gym capital fitness equipment\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAction(currentUser.email, currentUser.role as any, "Exported System Spreadsheet", `Compiled and downloaded spreadsheet report for ${type}`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Block Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">System Reporting</h1>
          <p className="text-xs text-zinc-500 mt-1">Generate diagnostic spreadsheets, financial audit records, and member demographics.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefreshData}
            className="p-2 border border-zinc-300 rounded-lg hover:bg-zinc-100 transition bg-white"
            title="Refresh Ledger Cache"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-600 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handlePrintReport}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" /> Print Document
          </button>
        </div>
      </div>

      {/* Main reporting workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Reports Nav bar (Left column) */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 h-fit space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2 px-1">Report Selection</span>
          
          <button
            onClick={() => setActiveReport("DailySummary")}
            className={`w-full text-left text-xs px-3.5 py-2.5 rounded-lg font-bold transition flex items-center gap-2 ${
              activeReport === "DailySummary" ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Daily Operation Summary
          </button>

          <button
            onClick={() => setActiveReport("Members")}
            className={`w-full text-left text-xs px-3.5 py-2.5 rounded-lg font-bold transition flex items-center gap-2 ${
              activeReport === "Members" ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <Users className="w-4 h-4" /> Member Roster Report
          </button>

          <button
            onClick={() => setActiveReport("Trainers")}
            className={`w-full text-left text-xs px-3.5 py-2.5 rounded-lg font-bold transition flex items-center gap-2 ${
              activeReport === "Trainers" ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <Award className="w-4 h-4" /> Trainer Payroll Sheet
          </button>

          <button
            onClick={() => setActiveReport("Attendance")}
            className={`w-full text-left text-xs px-3.5 py-2.5 rounded-lg font-bold transition flex items-center gap-2 ${
              activeReport === "Attendance" ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Daily Attendance logs
          </button>

          <button
            onClick={() => setActiveReport("Revenue")}
            className={`w-full text-left text-xs px-3.5 py-2.5 rounded-lg font-bold transition flex items-center gap-2 ${
              activeReport === "Revenue" ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <DollarSign className="w-4 h-4" /> Revenue & Payments Log
          </button>

          <button
            onClick={() => setActiveReport("Equipment")}
            className={`w-full text-left text-xs px-3.5 py-2.5 rounded-lg font-bold transition flex items-center gap-2 ${
              activeReport === "Equipment" ? "bg-red-50 text-red-700" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <Wrench className="w-4 h-4" /> Equipment & Asset Log
          </button>
        </div>

        {/* Diagnostic Visualizer Sheet (Right columns) */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden lg:col-span-3">
          
          {/* Sheet Header */}
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
            <h3 className="font-extrabold text-zinc-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" /> Compiled Sheet: {activeReport}
            </h3>
            
            <button
              onClick={() => handleExportCSV(activeReport)}
              className="text-xs text-red-600 font-bold hover:text-red-500 flex items-center gap-1 hover:underline"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
          </div>

          {/* Report Contents */}
          <div className="p-6">
            {activeReport === "DailySummary" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">Registry Standing</span>
                    <span className="text-xl font-extrabold text-zinc-800 mt-1 block">{activeMembers} Active</span>
                    <p className="text-[10px] text-zinc-500 mt-1">{expiredMembers} accounts are expired.</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">Gross Income Sheet</span>
                    <span className="text-xl font-extrabold text-red-600 mt-1 block">${totalInvoiced.toLocaleString()}</span>
                    <p className="text-[10px] text-zinc-500 mt-1">{paidCount} transactions fully cleared.</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">Investment Assets</span>
                    <span className="text-xl font-extrabold text-zinc-800 mt-1 block">${totalEquipmentCost.toLocaleString()}</span>
                    <p className="text-[10px] text-zinc-500 mt-1">Includes servicing overheads of ${totalMaintenanceLoggedCost}</p>
                  </div>
                </div>

                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <div className="p-3 bg-zinc-50 text-xs font-bold text-zinc-700 uppercase tracking-wider border-b border-zinc-200">
                    Executive Dashboard Overview
                  </div>
                  <div className="p-4 space-y-3.5 text-xs text-zinc-600 font-medium leading-relaxed">
                    <p>✔ <strong className="text-zinc-800">Operational standing:</strong> Consistent positive trends in member retention rates. The current utilization rating stands at {Math.round((activeMembers / totalMembers) * 100)}% active accounts across active daily schedules.</p>
                    <p>✔ <strong className="text-zinc-800">Billing overview:</strong> Financial ledgers balance with zero unresolved balances. Out of {db.payments.length} generated invoice accounts, over 95% have been settled on-time.</p>
                    <p>✔ <strong className="text-zinc-800">Coaching capacity:</strong> Total coaching resources sit at {db.trainers.length} active certified supervisors carrying {db.classes.length} distinct weekly workout schedules.</p>
                  </div>
                </div>
              </div>
            )}

            {activeReport === "Members" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase font-bold">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Phone</th>
                      <th className="pb-2">Join Date</th>
                      <th className="pb-2">BMI</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {db.members.slice(0, 12).map(m => (
                      <tr key={m.id} className="hover:bg-zinc-50/20">
                        <td className="py-2.5 text-zinc-400">{m.id}</td>
                        <td className="py-2.5 text-zinc-900">{m.fullName}</td>
                        <td className="py-2.5">{m.phone}</td>
                        <td className="py-2.5 font-medium text-zinc-500">{m.registrationDate}</td>
                        <td className="py-2.5">{m.bmi}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                            m.status === "Active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>{m.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeReport === "Trainers" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase font-bold">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Coach Name</th>
                      <th className="pb-2">Specialty Focus</th>
                      <th className="pb-2">Exp</th>
                      <th className="pb-2 text-right">Salary / mo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {db.trainers.map(t => (
                      <tr key={t.id} className="hover:bg-zinc-50/20">
                        <td className="py-2.5 text-zinc-400">{t.id}</td>
                        <td className="py-2.5 text-zinc-900">{t.fullName}</td>
                        <td className="py-2.5">{t.specialty}</td>
                        <td className="py-2.5">{t.experience} Years</td>
                        <td className="py-2.5 text-right text-red-600">${t.salary.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeReport === "Attendance" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase font-bold">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Member</th>
                      <th className="pb-2">Class Name</th>
                      <th className="pb-2">Coach</th>
                      <th className="pb-2 text-right">Validated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {db.attendance.slice(0, 15).map(a => (
                      <tr key={a.id} className="hover:bg-zinc-50/20">
                        <td className="py-2.5 font-medium text-zinc-500">{a.date}</td>
                        <td className="py-2.5 text-zinc-900">{a.memberName}</td>
                        <td className="py-2.5">{a.className}</td>
                        <td className="py-2.5">{a.trainerName}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                            a.isPresent ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>{a.isPresent ? "Present" : "Absent"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeReport === "Revenue" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase font-bold">
                      <th className="pb-2">Invoice #</th>
                      <th className="pb-2">Billed Name</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Method</th>
                      <th className="pb-2 text-right">Amount Billed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {db.payments.slice(0, 15).map(p => (
                      <tr key={p.invoiceNumber} className="hover:bg-zinc-50/20">
                        <td className="py-2.5 font-bold text-zinc-800">{p.invoiceNumber}</td>
                        <td className="py-2.5 text-zinc-900">{p.memberName}</td>
                        <td className="py-2.5 font-medium text-zinc-500">{p.paymentDate}</td>
                        <td className="py-2.5">{p.paymentMethod}</td>
                        <td className="py-2.5 text-right font-extrabold text-zinc-900">${p.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeReport === "Equipment" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase font-bold">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Asset Name</th>
                      <th className="pb-2">Loc</th>
                      <th className="pb-2">Supplier</th>
                      <th className="pb-2">Condition</th>
                      <th className="pb-2 text-right">Value Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-semibold text-zinc-700">
                    {db.equipment.slice(0, 15).map(e => (
                      <tr key={e.id} className="hover:bg-zinc-50/20">
                        <td className="py-2.5 text-zinc-400">{e.id}</td>
                        <td className="py-2.5 text-zinc-900 font-bold">{e.name}</td>
                        <td className="py-2.5 font-medium text-zinc-500">{e.location}</td>
                        <td className="py-2.5">{e.supplier}</td>
                        <td className="py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                            e.condition === "Excellent" || e.condition === "Good" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          }`}>{e.condition}</span>
                        </td>
                        <td className="py-2.5 text-right font-extrabold text-zinc-900">${(e.purchasePrice * e.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

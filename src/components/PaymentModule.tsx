/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Payment, Member } from "../types";
import { getDb, saveDb, logAction, addNotification } from "../db/mockDb";
import {
  Search,
  Plus,
  Printer,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  CheckCircle2,
  FileSpreadsheet,
  FileText
} from "lucide-react";

interface PaymentModuleProps {
  currentUser: { email: string; role: string; id: string };
  searchTerm: string;
}

export default function PaymentModule({ currentUser, searchTerm }: PaymentModuleProps) {
  const [db, setDb] = useState(getDb());
  const [searchLocal, setSearchLocal] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Invoice creator state
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberSelectId, setMemberSelectId] = useState(db.members[0]?.id || "");
  const [planSelectId, setPlanSelectId] = useState(db.plans[0]?.id || "");
  const [discountVal, setDiscountVal] = useState(0);
  const [payMethod, setPayMethod] = useState<Payment["paymentMethod"]>("Card");

  // Printable receipt state
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);

  const activeSearch = searchLocal || searchTerm;

  // Filter Payments
  const filteredPayments = db.payments.filter(p => {
    // If current role is Member, only show their own payments
    if (currentUser.role === "Member") {
      const activeMember = db.members.find(m => m.email.toLowerCase() === currentUser.email.toLowerCase());
      if (activeMember && p.memberId !== activeMember.id) {
        return false;
      }
    }

    const matchesSearch =
      p.memberName.toLowerCase().includes(activeSearch.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(activeSearch.toLowerCase()) ||
      p.planName.toLowerCase().includes(activeSearch.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(activeSearch.toLowerCase());

    const matchesMethod = methodFilter === "All" || p.paymentMethod === methodFilter;
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb = getDb();

    const member = updatedDb.members.find(m => m.id === memberSelectId);
    const plan = updatedDb.plans.find(p => p.id === planSelectId);

    if (!member || !plan) return;

    const invoiceNumber = `INV-${10000 + updatedDb.payments.length + 1}`;
    const receiptNumber = `RCP-${50000 + updatedDb.payments.length + 1}`;

    const baseAmount = plan.price;
    const discountAmount = parseFloat(((baseAmount * discountVal) / 100).toFixed(2));
    const tax = parseFloat(((baseAmount - discountAmount) * 0.08).toFixed(2));
    const totalAmount = parseFloat((baseAmount - discountAmount + tax).toFixed(2));

    const newPayment: Payment = {
      invoiceNumber,
      memberId: member.id,
      memberName: member.fullName,
      planId: plan.id,
      planName: plan.name,
      amount: baseAmount,
      discount: discountAmount,
      tax,
      totalAmount,
      paymentMethod: payMethod,
      paymentDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      balance: 0,
      receiptNumber,
      status: "Paid"
    };

    updatedDb.payments.unshift(newPayment);

    // Renew membership status automatically if they paid
    updatedDb.members = updatedDb.members.map(m => {
      if (m.id === member.id) {
        return { ...m, status: "Active", membershipPlanId: plan.id };
      }
      return m;
    });

    logAction(currentUser.email, currentUser.role as any, "Recorded Payment Invoicing", `Collected $${totalAmount} from ${member.fullName} for plan ${plan.name}`);
    addNotification("Payment Verified", `$${totalAmount} invoice settled for ${member.fullName}. Plan renewed.`, "Payment");

    saveDb(updatedDb);
    setDb(updatedDb);
    setShowAddModal(false);
  };

  const handlePrintReceipt = (p: Payment) => {
    setActiveReceipt(p);
  };

  return (
    <div className="space-y-6">
      {/* Printable Receipt Modal Overlay */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:static print:shadow-none print:inset-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl p-6 border border-zinc-200 relative print:border-none print:shadow-none print:p-0">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Invoice Sheet */}
            <div className="p-4" id="receipt-invoice-print">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-5">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
                    <span className="bg-red-600 text-white p-1 rounded-md"><DollarSign className="w-4 h-4" /></span> Comfort Gym
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">789 High-Performance Way, Suite 100<br />Comfort City, CC 90210<br />support@comfortgym.com</p>
                </div>
                <div className="text-right">
                  <h3 className="font-extrabold text-zinc-800 text-sm uppercase tracking-wider">Official Receipt</h3>
                  <p className="text-xs text-zinc-500 mt-1">Invoice: {activeReceipt.invoiceNumber}</p>
                  <p className="text-xs text-zinc-500">Receipt: {activeReceipt.receiptNumber}</p>
                  <p className="text-xs text-zinc-500">Date: {activeReceipt.paymentDate}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="my-5 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Billed To:</span>
                  <p className="font-bold text-zinc-800 mt-1 text-sm">{activeReceipt.memberName}</p>
                  <p className="text-zinc-500 mt-0.5">Member ID: {activeReceipt.memberId}</p>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Payment Method:</span>
                  <p className="font-bold text-zinc-800 mt-1 text-sm">{activeReceipt.paymentMethod}</p>
                  <span className="inline-block bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded text-[10px] mt-1 border border-green-100">
                    TRANSACTION SETTLED
                  </span>
                </div>
              </div>

              {/* Particulars Table */}
              <table className="w-full text-left border-collapse border-b border-zinc-200 text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 uppercase text-[10px] bg-zinc-50 font-bold">
                    <th className="py-2 px-3">Membership Plan / Particulars</th>
                    <th className="py-2 px-3 text-right">Base Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  <tr>
                    <td className="py-3 px-3">
                      <span className="font-bold text-zinc-800">{activeReceipt.planName}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Full access pass to gym facilities & designated classes.</p>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-zinc-700">${activeReceipt.amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Total Calculation */}
              <div className="w-1/2 ml-auto mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between font-medium text-zinc-600">
                  <span>Subtotal:</span>
                  <span>${activeReceipt.amount.toFixed(2)}</span>
                </div>
                {activeReceipt.discount > 0 && (
                  <div className="flex justify-between font-medium text-green-600">
                    <span>Discount:</span>
                    <span>-${activeReceipt.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-zinc-600">
                  <span>Sales Tax (8%):</span>
                  <span>${activeReceipt.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 font-extrabold text-sm text-zinc-900">
                  <span>Total Amount Paid:</span>
                  <span>${activeReceipt.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-zinc-200 mt-8 pt-4 text-center">
                <p className="text-[10px] text-zinc-400 font-medium">Thank you for training with Comfort Gym! Your efforts build character.<br />This is a digitally compiled tax invoice which serves as official validation.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 print:hidden">
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2 rounded-lg text-xs font-bold text-zinc-600 border border-zinc-300 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Payment Ledger</h1>
          <p className="text-xs text-zinc-500 mt-1">Track financial inflows, tax rates, plan collections, and invoice histories.</p>
        </div>

        {currentUser.role === "Administrator" && (
          <button
            id="record-payment-btn"
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Collect Payment
          </button>
        )}
      </div>

      {/* Tables & Filtration */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Filtration bar */}
        <div className="p-4 bg-zinc-50/50 border-b border-zinc-200 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchLocal}
              onChange={(e) => setSearchLocal(e.target.value)}
              className="pl-9 pr-4 block w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-xs bg-white"
              placeholder="Search by name, invoice #, plan, or receipt..."
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500 uppercase bg-zinc-50/20">
                <th className="p-4 font-semibold">Invoice Number</th>
                <th className="p-4 font-semibold">Member Details</th>
                <th className="p-4 font-semibold">Plan Enrolled</th>
                <th className="p-4 font-semibold">Paid Amount</th>
                <th className="p-4 font-semibold">Transaction Date</th>
                <th className="p-4 font-semibold">Receipt Number</th>
                <th className="p-4 font-semibold">Mode</th>
                <th className="p-4 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    No financial ledgers matching the filtration search.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map(p => (
                  <tr key={p.invoiceNumber} className="hover:bg-zinc-50/50">
                    <td className="p-4 font-extrabold text-zinc-800">{p.invoiceNumber}</td>
                    <td className="p-4">
                      <p className="font-bold text-zinc-800">{p.memberName}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{p.memberId}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-zinc-700">{p.planName}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-extrabold text-zinc-900">${p.totalAmount.toLocaleString()}</p>
                      {p.discount > 0 && <p className="text-[10px] text-green-600 font-semibold mt-0.5">Discount: -${p.discount}</p>}
                    </td>
                    <td className="p-4 font-semibold text-zinc-600">{p.paymentDate}</td>
                    <td className="p-4 font-semibold text-zinc-500">{p.receiptNumber}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-zinc-700">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-400" /> {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handlePrintReceipt(p)}
                        className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded border border-transparent transition"
                        title="Print Invoice Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 bg-zinc-50/50 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Showing {filteredPayments.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredPayments.length)} of {filteredPayments.length} transactions
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border border-zinc-300 rounded hover:bg-zinc-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-zinc-700 flex items-center px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 border border-zinc-300 rounded hover:bg-zinc-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-zinc-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-lg font-extrabold text-zinc-800">Record Payment & Billing</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Select Member</label>
                <select
                  value={memberSelectId}
                  onChange={(e) => setMemberSelectId(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  {db.members.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Select Plan</label>
                <select
                  value={planSelectId}
                  onChange={(e) => setPlanSelectId(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  {db.plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Discount (%)</label>
                  <select
                    value={discountVal}
                    onChange={(e) => setDiscountVal(parseInt(e.target.value) || 0)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="0">0% Discount</option>
                    <option value="5">5% Promo</option>
                    <option value="10">10% Off</option>
                    <option value="15">15% Special</option>
                    <option value="20">20% VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Credit Card</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition"
                >
                  Verify & Collect Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

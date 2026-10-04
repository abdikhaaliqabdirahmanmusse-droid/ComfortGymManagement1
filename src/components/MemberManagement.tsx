/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Member, MembershipPlan } from "../types";
import { getDb, saveDb, logAction, addNotification } from "../db/mockDb";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Award,
  Calendar,
  AlertCircle
} from "lucide-react";

interface MemberManagementProps {
  currentUser: { email: string; role: string };
  searchTerm: string;
}

export default function MemberManagement({ currentUser, searchTerm }: MemberManagementProps) {
  const [db, setDb] = useState(getDb());
  const [searchLocal, setSearchLocal] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [planFilter, setPlanFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState("");
  const [formName, setFormName] = useState("");
  const [formGender, setFormGender] = useState<"Male" | "Female" | "Other">("Male");
  const [formDob, setFormDob] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formEmergency, setFormEmergency] = useState("");
  const [formMedical, setFormMedical] = useState("");
  const [formHeight, setFormHeight] = useState(175);
  const [formWeight, setFormWeight] = useState(70);
  const [formPlanId, setFormPlanId] = useState(db.plans[0]?.id || "");
  const [formStatus, setFormStatus] = useState<Member["status"]>("Active");

  // Printable card state
  const [printMember, setPrintMember] = useState<Member | null>(null);

  const activeSearch = searchLocal || searchTerm;

  // Filter members
  const filteredMembers = db.members.filter(m => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(activeSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(activeSearch.toLowerCase()) ||
      m.phone.includes(activeSearch) ||
      m.id.toLowerCase().includes(activeSearch.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    const matchesPlan = planFilter === "All" || m.membershipPlanId === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentMemberId("");
    setFormName("");
    setFormGender("Male");
    setFormDob("1995-01-01");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormEmergency("");
    setFormMedical("None");
    setFormHeight(175);
    setFormWeight(70);
    setFormPlanId(db.plans[0]?.id || "");
    setFormStatus("Active");
    setShowModal(true);
  };

  const openEditModal = (m: Member) => {
    setIsEditing(true);
    setCurrentMemberId(m.id);
    setFormName(m.fullName);
    setFormGender(m.gender);
    setFormDob(m.dateOfBirth);
    setFormPhone(m.phone);
    setFormEmail(m.email);
    setFormAddress(m.address);
    setFormEmergency(m.emergencyContact);
    setFormMedical(m.medicalNotes);
    setFormHeight(m.height);
    setFormWeight(m.weight);
    setFormPlanId(m.membershipPlanId);
    setFormStatus(m.status);
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb = getDb();

    const heightInMeters = formHeight / 100;
    const bmi = parseFloat((formWeight / (heightInMeters * heightInMeters)).toFixed(1));

    if (isEditing) {
      // Edit
      updatedDb.members = updatedDb.members.map(m => {
        if (m.id === currentMemberId) {
          return {
            ...m,
            fullName: formName,
            gender: formGender,
            dateOfBirth: formDob,
            phone: formPhone,
            email: formEmail,
            address: formAddress,
            emergencyContact: formEmergency,
            medicalNotes: formMedical,
            height: formHeight,
            weight: formWeight,
            bmi,
            membershipPlanId: formPlanId,
            status: formStatus
          };
        }
        return m;
      });

      logAction(currentUser.email, currentUser.role as any, "Updated Member Profile", `Modified member records for ${formName} (${currentMemberId})`);
    } else {
      // Create
      const newId = `MEM-${String(updatedDb.members.length + 1).padStart(3, "0")}`;
      const newMember: Member = {
        id: newId,
        fullName: formName,
        gender: formGender,
        dateOfBirth: formDob,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        emergencyContact: formEmergency,
        medicalNotes: formMedical,
        height: formHeight,
        weight: formWeight,
        bmi,
        registrationDate: new Date().toISOString().split("T")[0],
        membershipPlanId: formPlanId,
        status: formStatus,
        photoUrl: `https://images.unsplash.com/photo-${formGender === "Female" ? "1534528741775-53994a69daeb" : "1507003211169-0a1dd7228f2d"}?auto=format&fit=crop&q=80&w=200`
      };

      updatedDb.members.push(newMember);

      // Create associated default invoice
      const chosenPlan = updatedDb.plans.find(p => p.id === formPlanId) || updatedDb.plans[0];
      const invoiceNumber = `INV-${10000 + updatedDb.payments.length + 1}`;
      updatedDb.payments.unshift({
        invoiceNumber,
        memberId: newId,
        memberName: formName,
        planId: chosenPlan.id,
        planName: chosenPlan.name,
        amount: chosenPlan.price,
        discount: 0,
        tax: parseFloat((chosenPlan.price * 0.08).toFixed(2)),
        totalAmount: parseFloat((chosenPlan.price * 1.08).toFixed(2)),
        paymentMethod: "Cash",
        paymentDate: newMember.registrationDate,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        balance: 0,
        receiptNumber: `RCP-${50000 + updatedDb.payments.length + 1}`,
        status: formStatus === "Active" ? "Paid" : "Unpaid"
      });

      logAction(currentUser.email, currentUser.role as any, "Registered New Member", `Enrolled member ${formName} on plan ${chosenPlan.name}`);
      addNotification("New Member Enrolled", `${formName} has been fully registered as ${newId}.`, "General");
    }

    saveDb(updatedDb);
    setDb(updatedDb);
    setShowModal(false);
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to delete member ${name}? This action cannot be undone.`)) {
      const updatedDb = getDb();
      updatedDb.members = updatedDb.members.filter(m => m.id !== id);
      updatedDb.users = updatedDb.users.filter(u => u.profileId !== id);
      
      logAction(currentUser.email, currentUser.role as any, "Deleted Member Profile", `Removed member record for ${name} (${id})`);
      saveDb(updatedDb);
      setDb(updatedDb);
    }
  };

  const handlePrintCard = (m: Member) => {
    setPrintMember(m);
  };

  const triggerPrintWindow = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Layout Overlay (Only active during actual screen printing) */}
      {printMember && (
        <div id="print-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:static print:shadow-none print:inset-auto">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 border border-zinc-200 relative print:border-none print:shadow-none print:p-0">
            <button
              onClick={() => setPrintMember(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-bold text-zinc-800 text-center text-sm uppercase tracking-wider mb-4 print:hidden">Comfort Membership Badge</h3>

            {/* Simulated Printed Card */}
            <div className="border border-zinc-300 rounded-xl p-5 bg-zinc-900 text-white shadow-md relative overflow-hidden h-64 flex flex-col justify-between">
              {/* Card top banner */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 p-1 rounded text-white">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <span className="font-extrabold text-sm tracking-wide">Comfort Gym</span>
                </div>
                <span className="text-[9px] uppercase tracking-widest bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.5 rounded font-bold">
                  Member
                </span>
              </div>

              {/* Card body */}
              <div className="flex gap-4 items-center my-4">
                <img
                  src={printMember.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                  alt={printMember.fullName}
                  className="w-20 h-20 rounded-lg object-cover border-2 border-zinc-700"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-base leading-tight">{printMember.fullName}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">ID: {printMember.id}</p>
                  <p className="text-[11px] text-zinc-400">Join Date: {printMember.registrationDate}</p>
                  <p className="text-[11px] text-zinc-400">Emergency Contact: {printMember.emergencyContact.split(" - ")[0]}</p>
                </div>
              </div>

              {/* Card footer */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-[10px] text-zinc-500">
                <span>Access Code: {printMember.phone.slice(-4)}</span>
                <span className="font-bold text-green-400">STATUS: {printMember.status}</span>
              </div>
            </div>

            {/* Print actions */}
            <div className="mt-6 flex gap-3 print:hidden">
              <button
                onClick={() => setPrintMember(null)}
                className="flex-1 py-2 rounded-lg text-xs font-bold text-zinc-600 border border-zinc-300 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={triggerPrintWindow}
                className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" /> Print Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control panel header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Member Registry</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage client profiles, diagnostic metrics, and physical emergency contacts.</p>
        </div>
        
        {currentUser.role === "Administrator" && (
          <button
            id="add-member-btn"
            onClick={openAddModal}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Add New Member
          </button>
        )}
      </div>

      {/* Advanced search, filters, registry list */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Filter bar */}
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
              placeholder="Search registry by name, email, phone or ID..."
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
            >
              <option value="All">All Plans</option>
              {db.plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500 uppercase bg-zinc-50/20">
                <th className="p-4 font-semibold">Member</th>
                <th className="p-4 font-semibold">Contact info</th>
                <th className="p-4 font-semibold">Biometrics</th>
                <th className="p-4 font-semibold">Membership</th>
                <th className="p-4 font-semibold">Joined Date</th>
                <th className="p-4 font-semibold">Status</th>
                {currentUser.role === "Administrator" && <th className="p-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No gym members matching the current search criteria.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map(m => {
                  const plan = db.plans.find(p => p.id === m.membershipPlanId);
                  return (
                    <tr key={m.id} className="hover:bg-zinc-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                            alt={m.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold text-zinc-800 text-sm block">{m.fullName}</span>
                            <span className="text-[10px] font-semibold text-zinc-400 mt-0.5 block">{m.id} • {m.gender}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-zinc-700">{m.email}</p>
                        <p className="text-zinc-400 mt-0.5">{m.phone}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-zinc-700">{m.height}cm / {m.weight}kg</p>
                        <span className={`inline-block font-semibold px-1.5 py-0.5 rounded text-[10px] mt-1 ${
                          m.bmi >= 25 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                        }`}>
                          BMI: {m.bmi}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-zinc-800">{plan?.name || "None"}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Price: ${plan?.price}</p>
                      </td>
                      <td className="p-4 font-medium text-zinc-600">{m.registrationDate}</td>
                      <td className="p-4">
                        <span className={`inline-block font-bold px-2 py-1 rounded text-[10px] ${
                          m.status === "Active" ? "bg-green-50 text-green-700" :
                          m.status === "Expired" ? "bg-red-50 text-red-700" : "bg-zinc-100 text-zinc-600"
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      {currentUser.role === "Administrator" && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handlePrintCard(m)}
                              className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded transition"
                              title="Print Membership Card"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(m)}
                              className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-zinc-100 rounded transition"
                              title="Edit Member"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(m.id, m.fullName)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-zinc-100 rounded transition"
                              title="Delete Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-4 bg-zinc-50/50 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Showing {filteredMembers.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredMembers.length)} of {filteredMembers.length} records
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

      {/* Create / Edit Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl p-6 border border-zinc-200 my-8">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-lg font-extrabold text-zinc-800">
                {isEditing ? `Edit Profile: ${formName}` : "Register New Member"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="Mary Taylor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="+1 (555) 012-3456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="mary.taylor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="789 Broadway Ave"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Emergency Contact & Rel.</label>
                  <input
                    type="text"
                    required
                    value={formEmergency}
                    onChange={(e) => setFormEmergency(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="John Taylor (Spouse) - 555-012-7890"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Medical Diagnostics / Notes</label>
                  <input
                    type="text"
                    value={formMedical}
                    onChange={(e) => setFormMedical(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="e.g. Asthma, Knee pain, None"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    value={formHeight}
                    onChange={(e) => setFormHeight(parseInt(e.target.value) || 170)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    min="100"
                    max="250"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    required
                    value={formWeight}
                    onChange={(e) => setFormWeight(parseInt(e.target.value) || 70)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    min="30"
                    max="300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Membership Plan</label>
                  <select
                    value={formPlanId}
                    onChange={(e) => setFormPlanId(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    {db.plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Membership Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Info banner about automated processes */}
              <div className="bg-red-50 text-red-800 text-[11px] p-3 rounded-lg border border-red-100 flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Automated Database Synchronicity:</span> BMI diagnostics are automatically calculated using metric height and weight. Submitting will register an automated financial billing transaction record, compiling tax and ledger balance codes accordingly.
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition"
                >
                  {isEditing ? "Save Changes" : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

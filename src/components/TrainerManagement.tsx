/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Trainer } from "../types";
import { getDb, saveDb, logAction, addNotification } from "../db/mockDb";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Award,
  DollarSign,
  Calendar,
  Briefcase,
  Sliders,
  CheckCircle2
} from "lucide-react";

interface TrainerManagementProps {
  currentUser: { email: string; role: string };
  searchTerm: string;
}

export default function TrainerManagement({ currentUser, searchTerm }: TrainerManagementProps) {
  const [db, setDb] = useState(getDb());
  const [searchLocal, setSearchLocal] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("All");

  // Form States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTrainerId, setCurrentTrainerId] = useState("");
  const [formName, setFormName] = useState("");
  const [formGender, setFormGender] = useState<"Male" | "Female" | "Other">("Male");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formCert, setFormCert] = useState("");
  const [formExp, setFormExp] = useState(3);
  const [formSalary, setFormSalary] = useState(3500);
  const [formAvailability, setFormAvailability] = useState("Mon-Fri (6 AM - 2 PM)");

  // Assigned classes drawer view state
  const [inspectTrainer, setInspectTrainer] = useState<Trainer | null>(null);

  const activeSearch = searchLocal || searchTerm;

  // Filter list
  const filteredTrainers = db.trainers.filter(t => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(activeSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(activeSearch.toLowerCase()) ||
      t.specialty.toLowerCase().includes(activeSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(activeSearch.toLowerCase());
    
    const matchesSpecialty = specialtyFilter === "All" || t.specialty === specialtyFilter;

    return matchesSearch && matchesSpecialty;
  });

  // Extract all unique specialties for filtering
  const specialties = Array.from(new Set(db.trainers.map(t => t.specialty)));

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentTrainerId("");
    setFormName("");
    setFormGender("Male");
    setFormPhone("");
    setFormEmail("");
    setFormSpecialty("Cardio Training");
    setFormCert("NASM Certified Personal Trainer");
    setFormExp(3);
    setFormSalary(3800);
    setFormAvailability("Mon-Fri (6 AM - 2 PM)");
    setShowModal(true);
  };

  const openEditModal = (t: Trainer) => {
    setIsEditing(true);
    setCurrentTrainerId(t.id);
    setFormName(t.fullName);
    setFormGender(t.gender);
    setFormPhone(t.phone);
    setFormEmail(t.email);
    setFormSpecialty(t.specialty);
    setFormCert(t.certification);
    setFormExp(t.experience);
    setFormSalary(t.salary);
    setFormAvailability(t.availability);
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb = getDb();

    if (isEditing) {
      updatedDb.trainers = updatedDb.trainers.map(t => {
        if (t.id === currentTrainerId) {
          return {
            ...t,
            fullName: formName,
            gender: formGender,
            phone: formPhone,
            email: formEmail,
            specialty: formSpecialty,
            certification: formCert,
            experience: formExp,
            salary: formSalary,
            availability: formAvailability
          };
        }
        return t;
      });

      // Synchronize in classes as well
      updatedDb.classes = updatedDb.classes.map(c => {
        if (c.trainerId === currentTrainerId) {
          return { ...c, trainerName: formName };
        }
        return c;
      });

      logAction(currentUser.email, currentUser.role as any, "Updated Trainer Profile", `Modified trainer profile for ${formName} (${currentTrainerId})`);
    } else {
      const newId = `TRN-${String(updatedDb.trainers.length + 1).padStart(3, "0")}`;
      const newTrainer: Trainer = {
        id: newId,
        fullName: formName,
        gender: formGender,
        phone: formPhone,
        email: formEmail,
        specialty: formSpecialty,
        certification: formCert,
        experience: formExp,
        salary: formSalary,
        availability: formAvailability,
        photoUrl: `https://images.unsplash.com/photo-${formGender === "Female" ? "1494790108377-be9c29b29330" : "1500648767791-00dcc994a43e"}?auto=format&fit=crop&q=80&w=200`
      };

      updatedDb.trainers.push(newTrainer);

      // Create a user record as well
      updatedDb.users.push({
        id: `U-${newId}`,
        email: formEmail,
        fullName: formName,
        role: "Trainer",
        profileId: newId,
        registrationDate: new Date().toISOString().split("T")[0],
        isActive: true
      });

      logAction(currentUser.email, currentUser.role as any, "Hired New Trainer", `Onboarded coach ${formName} specializing in ${formSpecialty}`);
      addNotification("New Staff Member Onboarded", `${formName} has joined the training crew as ${newId}.`, "Trainer");
    }

    saveDb(updatedDb);
    setDb(updatedDb);
    setShowModal(false);
  };

  const handleDeleteTrainer = (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to terminate/delete Trainer ${name}? Warning: Classes currently assigned to this trainer will need a new supervisor.`)) {
      const updatedDb = getDb();
      updatedDb.trainers = updatedDb.trainers.filter(t => t.id !== id);
      updatedDb.users = updatedDb.users.filter(u => u.profileId !== id);

      // Nullify or assign default admin to classes
      updatedDb.classes = updatedDb.classes.map(c => {
        if (c.trainerId === id) {
          return { ...c, trainerId: "TRN-001", trainerName: "Chief Administrator" };
        }
        return c;
      });

      logAction(currentUser.email, currentUser.role as any, "Terminated Trainer Record", `Removed trainer profile and reassigned active classes for ${name} (${id})`);
      saveDb(updatedDb);
      setDb(updatedDb);
    }
  };

  return (
    <div className="space-y-6">
      {/* Assigned Classes Inspector Drawer */}
      {inspectTrainer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slide-in">
            <div>
              <div className="flex justify-between items-center border-b border-zinc-100 pb-4 mb-4">
                <h3 className="font-extrabold text-zinc-800 text-base">Class Assignment Log</h3>
                <button onClick={() => setInspectTrainer(null)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3.5 mb-6">
                <img
                  src={inspectTrainer.photoUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"}
                  alt={inspectTrainer.fullName}
                  className="w-14 h-14 rounded-full object-cover border border-zinc-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-base text-zinc-900">{inspectTrainer.fullName}</h4>
                  <p className="text-xs text-red-600 font-semibold">{inspectTrainer.specialty}</p>
                </div>
              </div>

              <h5 className="font-bold text-xs text-zinc-500 uppercase tracking-wider mb-3">Assigned Gym Classes</h5>
              <div className="space-y-3">
                {db.classes.filter(c => c.trainerId === inspectTrainer.id).length === 0 ? (
                  <p className="text-xs text-zinc-500 bg-zinc-50 p-4 rounded-lg text-center border border-zinc-200">
                    This coach is not currently assigned to any scheduled gym classes.
                  </p>
                ) : (
                  db.classes.filter(c => c.trainerId === inspectTrainer.id).map(c => (
                    <div key={c.id} className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50 hover:bg-zinc-50 transition">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-zinc-800 text-xs">{c.name}</span>
                        <span className="text-[9px] font-bold text-zinc-400">{c.id}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">Schedule: {c.schedule.join(", ")}</p>
                      <p className="text-[11px] text-red-600 font-bold mt-1">{c.startTime} - {c.endTime} | Room {c.room}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setInspectTrainer(null)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 rounded-lg text-xs mt-6 transition"
            >
              Done Reviewing
            </button>
          </div>
        </div>
      )}

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Trainer Directory</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage physical coaches, salary grades, specialties, and schedule availabilities.</p>
        </div>

        {currentUser.role === "Administrator" && (
          <button
            id="add-trainer-btn"
            onClick={openAddModal}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Onboard Trainer
          </button>
        )}
      </div>

      {/* Filtration & Listing Grid */}
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
            placeholder="Search trainers by name, specialty, certification..."
          />
        </div>

        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
        >
          <option value="All">All Specialties</option>
          {specialties.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {/* Trainer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainers.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-zinc-200 col-span-full text-zinc-500">
            No trainers matching current directory search.
          </div>
        ) : (
          filteredTrainers.map(t => {
            const classCount = db.classes.filter(c => c.trainerId === t.id).length;
            return (
              <div key={t.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden">
                {/* Header Section */}
                <div className="p-5">
                  <div className="flex gap-4">
                    <img
                      src={t.photoUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"}
                      alt={t.fullName}
                      className="w-16 h-16 rounded-xl object-cover border border-zinc-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                        {t.id}
                      </span>
                      <h3 className="font-extrabold text-zinc-800 text-base leading-tight mt-1">{t.fullName}</h3>
                      <p className="text-xs text-zinc-500 font-medium">{t.specialty}</p>
                    </div>
                  </div>

                  {/* Diagnostic stats */}
                  <div className="grid grid-cols-2 gap-2 mt-5 border-t border-b border-zinc-100 py-3.5 my-3 text-xs">
                    <div>
                      <span className="text-zinc-400 font-medium block">Experience</span>
                      <span className="font-bold text-zinc-700 mt-0.5 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-zinc-400" /> {t.experience} Years
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-medium block">Monthly Pay</span>
                      <span className="font-bold text-zinc-700 mt-0.5 flex items-center gap-0.5 text-red-600">
                        <DollarSign className="w-3.5 h-3.5 text-red-400" /> {t.salary.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Credentials / Details list */}
                  <div className="space-y-2.5 text-xs text-zinc-600 font-medium mt-3">
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{t.certification}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{t.availability}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Bottom */}
                <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex justify-between items-center">
                  <button
                    onClick={() => setInspectTrainer(t)}
                    className="text-xs text-zinc-700 font-semibold hover:text-red-600 flex items-center gap-1 transition"
                  >
                    View classes ({classCount})
                  </button>

                  {currentUser.role === "Administrator" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-zinc-200 transition"
                        title="Edit Trainer Info"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrainer(t.id, t.fullName)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-zinc-200 transition"
                        title="Delete Trainer"
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

      {/* Onboard / Edit Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl p-6 border border-zinc-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-lg font-extrabold text-zinc-800">
                {isEditing ? `Modify Coach Profile: ${formName}` : "Onboard New Fitness Coach"}
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
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Trainer Full Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="Coach Marcus"
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
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Email Address (Business)</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="marcus@comfortgym.com"
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
                    placeholder="+1 (555) 012-9988"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Main Specialty Specialty</label>
                  <select
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="Cardio Training">Cardio Training</option>
                    <option value="Bodybuilding">Bodybuilding</option>
                    <option value="Yoga & Mindfulness">Yoga & Mindfulness</option>
                    <option value="Pilates">Pilates</option>
                    <option value="CrossFit">CrossFit</option>
                    <option value="HIIT Training">HIIT Training</option>
                    <option value="Strength & Conditioning">Strength & Conditioning</option>
                    <option value="Zumba & Aerobics">Zumba & Aerobics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Trainer Certification</label>
                  <input
                    type="text"
                    required
                    value={formCert}
                    onChange={(e) => setFormCert(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="NASM Certified Trainer, Yoga RYT-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    required
                    value={formExp}
                    onChange={(e) => setFormExp(parseInt(e.target.value) || 1)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    min="1"
                    max="45"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Monthly Salary ($)</label>
                  <input
                    type="number"
                    required
                    value={formSalary}
                    onChange={(e) => setFormSalary(parseInt(e.target.value) || 2000)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    min="1000"
                    max="15000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Availability Slots</label>
                  <input
                    type="text"
                    required
                    value={formAvailability}
                    onChange={(e) => setFormAvailability(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="e.g. Mon-Fri (6 AM - 2 PM), Sat-Sun (8 AM - 6 PM)"
                  />
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
                  {isEditing ? "Save Changes" : "Confirm Hiring"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

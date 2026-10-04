/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FitnessClass, Trainer, Member } from "../types";
import { getDb, saveDb, logAction, addNotification } from "../db/mockDb";
import {
  Plus,
  Edit,
  Trash2,
  X,
  UserPlus,
  Users,
  Activity,
  Calendar,
  Layers,
  MapPin,
  Clock,
  AlertTriangle,
  Search
} from "lucide-react";

interface FitnessClassesProps {
  currentUser: { email: string; role: string };
  searchTerm: string;
}

export default function FitnessClasses({ currentUser, searchTerm }: FitnessClassesProps) {
  const [db, setDb] = useState(getDb());
  const [searchLocal, setSearchLocal] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClassId, setCurrentClassId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTrainerId, setFormTrainerId] = useState(db.trainers[0]?.id || "");
  const [formCapacity, setFormCapacity] = useState(20);
  const [formRoom, setFormRoom] = useState("Studio A");
  const [formDuration, setFormDuration] = useState("60 mins");
  const [formStart, setFormStart] = useState("08:00 AM");
  const [formEnd, setFormEnd] = useState("09:00 AM");
  const [formSchedule, setFormSchedule] = useState("Monday, Wednesday, Friday");
  const [formDifficulty, setFormDifficulty] = useState<FitnessClass["difficulty"]>("Intermediate");
  const [formStatus, setFormStatus] = useState<FitnessClass["status"]>("Active");

  // Enroll member drawer state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollClassId, setEnrollClassId] = useState("");
  const [enrollMemberId, setEnrollMemberId] = useState(db.members[0]?.id || "");

  const activeSearch = searchLocal || searchTerm;

  // Filter Classes
  const filteredClasses = db.classes.filter(c => {
    // If Trainer role, only show their assigned classes
    if (currentUser.role === "Trainer") {
      const activeTrainer = db.trainers.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase());
      if (activeTrainer && c.trainerId !== activeTrainer.id) {
        return false;
      }
    }

    const matchesSearch =
      c.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
      c.room.toLowerCase().includes(activeSearch.toLowerCase()) ||
      c.trainerName.toLowerCase().includes(activeSearch.toLowerCase()) ||
      c.id.toLowerCase().includes(activeSearch.toLowerCase());

    const matchesDiff = difficultyFilter === "All" || c.difficulty === difficultyFilter;

    return matchesSearch && matchesDiff;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb = getDb();

    const trainer = updatedDb.trainers.find(t => t.id === formTrainerId) || updatedDb.trainers[0];
    const scheduleArray = formSchedule.split(",").map(s => s.trim()).filter(s => s.length > 0);

    if (isEditing) {
      updatedDb.classes = updatedDb.classes.map(c => {
        if (c.id === currentClassId) {
          return {
            ...c,
            name: formName,
            description: formDesc,
            trainerId: trainer.id,
            trainerName: trainer.fullName,
            capacity: formCapacity,
            room: formRoom,
            duration: formDuration,
            startTime: formStart,
            endTime: formEnd,
            schedule: scheduleArray,
            difficulty: formDifficulty,
            status: formStatus
          };
        }
        return c;
      });

      logAction(currentUser.email, currentUser.role as any, "Modified Gym Class", `Updated configurations for ${formName} (${currentClassId})`);
    } else {
      const newId = `CLS-${String(updatedDb.classes.length + 1).padStart(3, "0")}`;
      const newClass: FitnessClass = {
        id: newId,
        name: formName,
        description: formDesc,
        trainerId: trainer.id,
        trainerName: trainer.fullName,
        capacity: formCapacity,
        room: formRoom,
        duration: formDuration,
        startTime: formStart,
        endTime: formEnd,
        schedule: scheduleArray,
        difficulty: formDifficulty,
        status: formStatus
      };

      updatedDb.classes.push(newClass);
      logAction(currentUser.email, currentUser.role as any, "Created Gym Class", `Listed scheduled session: ${formName} in ${formRoom}`);
      addNotification("New Gym Class Scheduled", `Session ${formName} has been posted in Room ${formRoom}.`, "Class");
    }

    saveDb(updatedDb);
    setDb(updatedDb);
    setShowModal(false);
  };

  const handleCancelClass = (id: string, name: string, isCurrentlyCancelled: boolean) => {
    const updatedDb = getDb();
    updatedDb.classes = updatedDb.classes.map(c => {
      if (c.id === id) {
        return { ...c, status: isCurrentlyCancelled ? "Active" : "Cancelled" };
      }
      return c;
    });

    logAction(currentUser.email, currentUser.role as any, isCurrentlyCancelled ? "Re-activated Class" : "Cancelled Class", `Updated standing of ${name}`);
    saveDb(updatedDb);
    setDb(updatedDb);
  };

  const handleDeleteClass = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete class ${name}? This will remove all associated enrollment mappings.`)) {
      const updatedDb = getDb();
      updatedDb.classes = updatedDb.classes.filter(c => c.id !== id);
      updatedDb.enrollments = updatedDb.enrollments.filter(e => e.classId !== id);

      logAction(currentUser.email, currentUser.role as any, "Deleted Gym Class", `Removed scheduled course ${name} (${id})`);
      saveDb(updatedDb);
      setDb(updatedDb);
    }
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb = getDb();

    const member = updatedDb.members.find(m => m.id === enrollMemberId);
    const cls = updatedDb.classes.find(c => c.id === enrollClassId);

    if (!member || !cls) return;

    // Check duplicate enrollment
    const duplicate = updatedDb.enrollments.some(e => e.classId === enrollClassId && e.memberId === enrollMemberId);
    if (duplicate) {
      alert(`${member.fullName} is already enrolled in this class.`);
      return;
    }

    // Check capacity limit
    const currentEnrolledCount = updatedDb.enrollments.filter(e => e.classId === enrollClassId).length;
    if (currentEnrolledCount >= cls.capacity) {
      alert(`Cannot enroll. Class has reached maximum limit of ${cls.capacity} students.`);
      return;
    }

    updatedDb.enrollments.push({
      id: `ENR-${member.id}-${cls.id}-${Date.now()}`,
      classId: cls.id,
      memberId: member.id,
      enrollmentDate: new Date().toISOString().split("T")[0]
    });

    logAction(currentUser.email, currentUser.role as any, "Enrolled Member In Class", `Scheduled ${member.fullName} into ${cls.name}`);
    addNotification("Class Enrollment Confirmed", `${member.fullName} enrolled in ${cls.name}.`, "General", member.id);

    saveDb(updatedDb);
    setDb(updatedDb);
    setShowEnrollModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Block Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Fitness Schedule</h1>
          <p className="text-xs text-zinc-500 mt-1">Design daily aerobics, power Yoga, body sculpting, and custom strength routines.</p>
        </div>

        {currentUser.role === "Administrator" && (
          <button
            id="add-class-btn"
            onClick={() => {
              setIsEditing(false);
              setCurrentClassId("");
              setFormName("");
              setFormDesc("");
              setFormTrainerId(db.trainers[0]?.id || "");
              setFormCapacity(20);
              setFormRoom("Studio A");
              setFormDuration("60 mins");
              setFormStart("08:00 AM");
              setFormEnd("09:00 AM");
              setFormSchedule("Monday, Wednesday, Friday");
              setFormDifficulty("Intermediate");
              setFormStatus("Active");
              setShowModal(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Create Class Session
          </button>
        )}
      </div>

      {/* Filtration controls */}
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
            placeholder="Search classes by name, room location, coach..."
          />
        </div>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
        >
          <option value="All">All Difficulty Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* Roster Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-zinc-200 col-span-full text-zinc-500">
            No scheduled classes matching current search constraints.
          </div>
        ) : (
          filteredClasses.map(c => {
            const enrolledCount = db.enrollments.filter(e => e.classId === c.id).length;
            const isCancelled = c.status === "Cancelled";
            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition ${
                  isCancelled ? "opacity-60 bg-zinc-50/50" : ""
                }`}
              >
                {/* Header */}
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      c.difficulty === "Beginner" ? "bg-green-50 text-green-700" :
                      c.difficulty === "Intermediate" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    }`}>
                      {c.difficulty}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      !isCancelled ? "bg-red-50 text-red-700" : "bg-zinc-200 text-zinc-600"
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-zinc-800 text-sm mt-3.5">{c.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2 h-8">{c.description}</p>

                  {/* Operational slots and details */}
                  <div className="grid grid-cols-2 gap-3 mt-4 border-t border-b border-zinc-100 py-3.5 my-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-zinc-400 font-medium">Time Interval</p>
                        <p className="font-bold text-zinc-700 mt-0.5">{c.startTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-zinc-400 font-medium">Room Loc.</p>
                        <p className="font-bold text-zinc-700 mt-0.5">{c.room}</p>
                      </div>
                    </div>
                  </div>

                  {/* Coach and Schedule */}
                  <div className="space-y-2 text-xs text-zinc-600 font-semibold">
                    <p className="flex justify-between">
                      <span className="text-zinc-400">Class Coach:</span>
                      <span className="text-zinc-800">{c.trainerName}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-400">Days Active:</span>
                      <span className="text-zinc-800 truncate max-w-[160px]">{c.schedule.join(", ")}</span>
                    </p>
                  </div>
                </div>

                {/* Footer and Enrollment Controls */}
                <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-500">
                    Enrolled: <span className="text-zinc-800">{enrolledCount} / {c.capacity}</span>
                  </span>

                  <div className="flex gap-1.5">
                    {currentUser.role === "Administrator" && (
                      <>
                        <button
                          onClick={() => {
                            setEnrollClassId(c.id);
                            setShowEnrollModal(true);
                          }}
                          disabled={isCancelled || enrolledCount >= c.capacity}
                          className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-zinc-200 transition disabled:opacity-40"
                          title="Enroll Member"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelClass(c.id, c.name, isCancelled)}
                          className={`p-1.5 rounded transition border border-transparent hover:border-zinc-200 ${
                            isCancelled ? "text-green-600 hover:bg-white" : "text-red-600 hover:bg-white"
                          }`}
                          title={isCancelled ? "Restore Class" : "Cancel Class"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setCurrentClassId(c.id);
                            setFormName(c.name);
                            setFormDesc(c.description);
                            setFormTrainerId(c.trainerId);
                            setFormCapacity(c.capacity);
                            setFormRoom(c.room);
                            setFormDuration(c.duration);
                            setFormStart(c.startTime);
                            setFormEnd(c.endTime);
                            setFormSchedule(c.schedule.join(", "));
                            setFormDifficulty(c.difficulty);
                            setFormStatus(c.status);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-zinc-200 transition"
                          title="Edit Class"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(c.id, c.name)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-zinc-200 transition"
                          title="Delete Class"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {currentUser.role === "Member" && (
                      <button
                        onClick={() => {
                          const memberProfile = db.members.find(m => m.email.toLowerCase() === currentUser.email.toLowerCase());
                          if (memberProfile) {
                            setEnrollMemberId(memberProfile.id);
                            setEnrollClassId(c.id);
                            // Auto-trigger submit for direct join! Beautiful Member UX
                            const updatedDb = getDb();
                            const already = updatedDb.enrollments.some(e => e.classId === c.id && e.memberId === memberProfile.id);
                            if (already) {
                              alert("You are already enrolled in this class.");
                              return;
                            }
                            updatedDb.enrollments.push({
                              id: `ENR-${memberProfile.id}-${c.id}-${Date.now()}`,
                              classId: c.id,
                              memberId: memberProfile.id,
                              enrollmentDate: new Date().toISOString().split("T")[0]
                            });
                            logAction(currentUser.email, "Member", "Enrolled Self In Class", `Joined session ${c.name}`);
                            addNotification("Direct Join Confirmed", `Successfully enrolled in ${c.name}. See you there!`, "Class", memberProfile.id);
                            saveDb(updatedDb);
                            setDb(updatedDb);
                          }
                        }}
                        disabled={isCancelled || enrolledCount >= c.capacity || db.enrollments.some(e => e.classId === c.id && e.memberId === db.members.find(m => m.email.toLowerCase() === currentUser.email.toLowerCase())?.id)}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-200 disabled:text-zinc-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                      >
                        {db.enrollments.some(e => e.classId === c.id && e.memberId === db.members.find(m => m.email.toLowerCase() === currentUser.email.toLowerCase())?.id) ? "Enrolled ✔" : "Join Session"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl p-6 border border-zinc-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-lg font-extrabold text-zinc-800">
                {isEditing ? `Modify Class: ${formName}` : "Create Fitness Class"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Class Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="Sunrise Zumba Party"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Assigned Coach</label>
                  <select
                    value={formTrainerId}
                    onChange={(e) => setFormTrainerId(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    {db.trainers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName} ({t.specialty})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Description / Goal</label>
                  <textarea
                    required
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white h-20"
                    placeholder="Enter aerobic details, cardio thresholds, equipment expectations..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Max Class Capacity</label>
                  <input
                    type="number"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(parseInt(e.target.value) || 20)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    min="5"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Room Allocation</label>
                  <input
                    type="text"
                    required
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="Studio B, Iron Arena"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="08:30 AM"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="09:30 AM"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Schedule Days (Comma separated)</label>
                  <input
                    type="text"
                    required
                    value={formSchedule}
                    onChange={(e) => setFormSchedule(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                    placeholder="Monday, Wednesday, Friday"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Difficulty Level</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
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
                  {isEditing ? "Save Changes" : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Member Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl p-6 border border-zinc-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Enroll Class Student</h2>
              <button onClick={() => setShowEnrollModal(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Select Member</label>
                <select
                  value={enrollMemberId}
                  onChange={(e) => setEnrollMemberId(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
                >
                  {db.members.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.id})</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-zinc-100 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

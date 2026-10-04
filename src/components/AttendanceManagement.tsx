/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Attendance, FitnessClass, Member } from "../types";
import { getDb, saveDb, logAction } from "../db/mockDb";
import {
  CheckSquare,
  Square,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Users
} from "lucide-react";

interface AttendanceManagementProps {
  currentUser: { email: string; role: string };
  searchTerm: string;
}

export default function AttendanceManagement({ currentUser, searchTerm }: AttendanceManagementProps) {
  const [db, setDb] = useState(getDb());
  const [selectedClassId, setSelectedClassId] = useState<string>(db.classes[0]?.id || "");
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [searchMember, setSearchMember] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedClass = db.classes.find(c => c.id === selectedClassId);

  // Get enrolled members for selected class
  const classEnrollments = db.enrollments.filter(e => e.classId === selectedClassId);
  const enrolledMemberIds = classEnrollments.map(e => e.memberId);
  const enrolledMembers = db.members.filter(m => enrolledMemberIds.includes(m.id));

  // Determine if attendance records already exist for this class & date
  const existingRecords = db.attendance.filter(
    a => a.classId === selectedClassId && a.date === attendanceDate
  );

  // Maintain a local checklist of present/absent states
  // We initialize from existing records, or default all to present
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  // Sync checklist state when class or date changes
  React.useEffect(() => {
    const initialChecklist: Record<string, boolean> = {};
    enrolledMembers.forEach(m => {
      const match = existingRecords.find(r => r.memberId === m.id);
      initialChecklist[m.id] = match ? match.isPresent : true; // default to Present
    });
    setChecklist(initialChecklist);
    setSuccessMsg("");
  }, [selectedClassId, attendanceDate]);

  const togglePresence = (memberId: string) => {
    setChecklist(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleCommitAttendance = () => {
    if (!selectedClass) return;

    const updatedDb = getDb();

    // Remove any pre-existing records for this class & date to prevent duplicates
    updatedDb.attendance = updatedDb.attendance.filter(
      a => !(a.classId === selectedClassId && a.date === attendanceDate)
    );

    // Build and push new records
    let counter = updatedDb.attendance.length + 1;
    enrolledMembers.forEach(m => {
      const isPresent = checklist[m.id] ?? true;
      updatedDb.attendance.push({
        id: `ATT-${String(counter++).padStart(4, "0")}`,
        memberId: m.id,
        memberName: m.fullName,
        classId: selectedClass.id,
        className: selectedClass.name,
        trainerId: selectedClass.trainerId,
        trainerName: selectedClass.trainerName,
        date: attendanceDate,
        isPresent
      });
    });

    logAction(
      currentUser.email,
      currentUser.role as any,
      "Recorded Attendance Logs",
      `Logged presence for ${enrolledMembers.length} members in class "${selectedClass.name}" on ${attendanceDate}`
    );

    saveDb(updatedDb);
    setDb(updatedDb);
    setSuccessMsg("Attendance records committed successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Recent attendance logs overview
  const recentLogs = db.attendance
    .filter(a => {
      // If trainer, only show attendance for their own classes
      if (currentUser.role === "Trainer") {
        const activeTrainer = db.trainers.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase());
        if (activeTrainer && a.trainerId !== activeTrainer.id) {
          return false;
        }
      }
      return true;
    })
    .slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Block Title Header */}
      <div>
        <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Attendance Logs</h1>
        <p className="text-xs text-zinc-500 mt-1">Record and verify daily client presence relative to schedules and certified coaches.</p>
      </div>

      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 text-xs text-green-700 rounded-r-md font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" /> {successMsg}
        </div>
      )}

      {/* Main double column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Marker Sheet */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200">
            <h3 className="font-extrabold text-zinc-800 text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-red-600" /> Presence Checker
            </h3>
          </div>

          <div className="p-4 border-b border-zinc-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Select Class Session</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 focus:outline-none bg-white"
              >
                {db.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.startTime})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Session Date</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="pl-9 pr-4 block w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Checklist Area */}
          <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
            {enrolledMembers.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                <p className="font-medium">No members enrolled in this class yet.</p>
                <p className="text-[11px] text-zinc-400 mt-1">Enroll members in the "Fitness Classes" tab before marking attendance.</p>
              </div>
            ) : (
              enrolledMembers
                .filter(m => m.fullName.toLowerCase().includes(searchMember.toLowerCase()))
                .map(m => {
                  const isPresent = checklist[m.id] ?? true;
                  return (
                    <div
                      key={m.id}
                      onClick={() => togglePresence(m.id)}
                      className="p-3.5 flex items-center justify-between hover:bg-zinc-50 cursor-pointer select-none transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={m.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                          alt={m.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-bold text-zinc-800 text-xs block">{m.fullName}</span>
                          <span className="text-[10px] text-zinc-400 block">{m.id}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition ${
                          isPresent
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Present
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-500" /> Absent
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
            )}
          </div>

          {/* Actions panel */}
          {enrolledMembers.length > 0 && (
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center">
              <div className="relative max-w-xs w-full">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  className="pl-8 pr-3 block w-full rounded-md border border-zinc-300 px-2.5 py-1 text-zinc-900 placeholder-zinc-400 focus:outline-none text-[11px] bg-white"
                  placeholder="Fuzzy search checklist names..."
                />
              </div>

              <button
                type="button"
                onClick={handleCommitAttendance}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition"
              >
                Commit Attendance Logs
              </button>
            </div>
          )}
        </div>

        {/* History Overview Log (Sidecar) */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden h-fit">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200">
            <h3 className="font-extrabold text-zinc-800 text-xs uppercase tracking-wider">Recent Validation History</h3>
          </div>
          <div className="divide-y divide-zinc-100 max-h-[450px] overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="text-center py-8 text-xs text-zinc-500">No recently registered attendance records.</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="p-3 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-zinc-800 font-bold">{log.memberName}</span>
                    <span className={`text-[10px] font-bold ${log.isPresent ? "text-green-600" : "text-red-600"}`}>
                      {log.isPresent ? "PRESENT" : "ABSENT"}
                    </span>
                  </div>
                  <p className="text-zinc-500 mt-0.5">{log.className}</p>
                  <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-1">
                    <span>Coach: {log.trainerName}</span>
                    <span className="font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> {log.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

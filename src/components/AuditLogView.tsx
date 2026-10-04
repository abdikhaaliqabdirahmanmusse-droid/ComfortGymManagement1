/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { getDb } from "../db/mockDb";
import { Shield, Search, Terminal, Filter, Calendar, Trash2 } from "lucide-react";

interface AuditLogViewProps {
  currentUser: { email: string; role: string };
  searchTerm: string;
}

export default function AuditLogView({ currentUser, searchTerm }: AuditLogViewProps) {
  const [db, setDb] = useState(getDb());
  const [searchLocal, setSearchLocal] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const activeSearch = searchLocal || searchTerm;

  const filteredLogs = db.logs.filter(log => {
    const matchesSearch =
      log.userEmail.toLowerCase().includes(activeSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(activeSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(activeSearch.toLowerCase());

    const matchesRole = roleFilter === "All" || log.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight">Security Audit Logs</h1>
        <p className="text-xs text-zinc-500 mt-1">Review full system-wide modifications, login timelines, and financial settlements.</p>
      </div>

      {/* Grid List */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        
        {/* Filters */}
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
              placeholder="Fuzzy search actor, action statement, description details..."
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white"
          >
            <option value="All">All Roles</option>
            <option value="Administrator">Administrator</option>
            <option value="Trainer">Trainer</option>
            <option value="Member">Member</option>
          </select>
        </div>

        {/* List Logs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-zinc-500 uppercase bg-zinc-50/20">
                <th className="p-4 font-semibold">Logged Timestamp</th>
                <th className="p-4 font-semibold">User / Actor</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Action Triggered</th>
                <th className="p-4 font-semibold">Details Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-[11px] font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 text-xs font-sans">
                    No matching audit logs recorded.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-zinc-50/50">
                    <td className="p-4 text-zinc-500 font-semibold">{log.timestamp}</td>
                    <td className="p-4 font-bold text-zinc-800">{log.userEmail}</td>
                    <td className="p-4">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-sans ${
                        log.role === "Administrator" ? "bg-red-50 text-red-700" :
                        log.role === "Trainer" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-700"
                      }`}>{log.role}</span>
                    </td>
                    <td className="p-4 font-bold text-zinc-900">{log.action}</td>
                    <td className="p-4 text-zinc-600 font-sans max-w-sm truncate" title={log.details}>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

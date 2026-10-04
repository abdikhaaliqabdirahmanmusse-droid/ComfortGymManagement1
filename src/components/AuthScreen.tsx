/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, UserRole } from "../types";
import { getDb, logAction } from "../db/mockDb";
import { Dumbbell, Lock, Mail, ShieldAlert, User as UserIcon, UserPlus } from "lucide-react";

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState("admin@comfortgym.com");
  const [password, setPassword] = useState("admin123");
  const [roleSelection, setRoleSelection] = useState<UserRole>("Administrator");
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fields for registering a new member
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const handleQuickLogin = (role: UserRole) => {
    const db = getDb();
    let sampleEmail = "admin@comfortgym.com";
    if (role === "Trainer") {
      sampleEmail = db.trainers[0]?.email || "trainer@comfortgym.com";
    } else if (role === "Member") {
      sampleEmail = db.members[0]?.email || "member@example.com";
    }

    setEmail(sampleEmail);
    setPassword("password123");
    setRoleSelection(role);
    setError("");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    const db = getDb();
    // In our mock system, we can verify if the user exists in db.users
    const foundUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser) {
      logAction(foundUser.email, foundUser.role, "User Login", `Logged in successfully with IP ${foundUser.id}`);
      onLoginSuccess(foundUser);
    } else {
      // Create a fallback user to facilitate testing
      const fallbackUser: User = {
        id: `U-MOCK-${Date.now()}`,
        email,
        fullName: email.split("@")[0].toUpperCase(),
        role: roleSelection,
        registrationDate: new Date().toISOString().split("T")[0],
        isActive: true
      };

      // Add to users db
      db.users.push(fallbackUser);
      // If member, create member record
      if (roleSelection === "Member") {
        db.members.push({
          id: `MEM-NEW`,
          fullName: fallbackUser.fullName,
          gender: "Male",
          dateOfBirth: "1995-01-01",
          phone: "+1 (555) 012-3456",
          email: fallbackUser.email,
          address: "123 Gym Street",
          emergencyContact: "Emergency Contact - 555-555-5555",
          medicalNotes: "None",
          height: 180,
          weight: 75,
          bmi: 23.1,
          registrationDate: fallbackUser.registrationDate,
          membershipPlanId: "PLAN-003", // Standard Monthly
          status: "Active"
        });
      }
      
      logAction(fallbackUser.email, fallbackUser.role, "User Registration & Login", `Created fallback testing session for role ${roleSelection}`);
      onLoginSuccess(fallbackUser);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!regName || !regEmail || !regPassword) {
      setError("Name, Email, and Password are required.");
      return;
    }

    const db = getDb();
    const exists = db.users.some(u => u.email.toLowerCase() === regEmail.toLowerCase());
    if (exists) {
      setError("Email address already registered.");
      return;
    }

    const newUserId = `U-REG-${Date.now()}`;
    const newMemberId = `MEM-${String(db.members.length + 1).padStart(3, "0")}`;

    // Add User
    const newUser: User = {
      id: newUserId,
      email: regEmail,
      fullName: regName,
      role: "Member",
      profileId: newMemberId,
      registrationDate: new Date().toISOString().split("T")[0],
      isActive: true
    };

    db.users.push(newUser);

    // Add Member
    db.members.push({
      id: newMemberId,
      userId: newUserId,
      fullName: regName,
      gender: "Male",
      dateOfBirth: "1998-05-15",
      phone: regPhone || "+1 (555) 123-4567",
      email: regEmail,
      address: "Comfort City Gym District",
      emergencyContact: "Spouse - +1 (555) 999-8888",
      medicalNotes: "None",
      height: 175,
      weight: 70,
      bmi: 22.9,
      registrationDate: newUser.registrationDate,
      membershipPlanId: "PLAN-003", // Standard Monthly
      status: "Active"
    });

    logAction(newUser.email, "Member", "Member Registration", `Registered and created member profile ${newMemberId}`);
    setSuccess("Account registered successfully! You can now log in.");
    setEmail(regEmail);
    setPassword(regPassword);
    setRoleSelection("Member");
    setMode("login");
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please specify your email.");
      return;
    }

    setSuccess("Password reset instructions have been simulated. An email was sent to " + email);
  };

  return (
    <div id="auth-screen" className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-zinc-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full text-red-600 mb-4 animate-bounce">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Comfort Gym</h2>
          <p className="mt-2 text-sm text-zinc-600 font-medium">
            Management System (GMS)
          </p>
        </div>

        {error && (
          <div id="auth-error" className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 rounded-r-md">
            {error}
          </div>
        )}

        {success && (
          <div id="auth-success" className="bg-green-50 border-l-4 border-green-500 p-4 text-sm text-green-700 rounded-r-md">
            {success}
          </div>
        )}

        {mode === "login" && (
          <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
            <div className="rounded-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs font-semibold text-red-600 hover:text-red-500"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-xs font-semibold text-red-600 hover:text-red-500 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Sign up as Member
              </button>
            </div>

            <div>
              <button
                id="login-btn"
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
              >
                Login
              </button>
            </div>

            {/* Quick login utility */}
            <div className="mt-6 border-t border-zinc-200 pt-6">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center mb-3">
                Quick Role Tester
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="quick-admin-login"
                  onClick={() => handleQuickLogin("Administrator")}
                  className={`py-1.5 px-2 text-xs font-medium rounded border transition ${
                    roleSelection === "Administrator"
                      ? "bg-red-50 border-red-200 text-red-700 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  id="quick-trainer-login"
                  onClick={() => handleQuickLogin("Trainer")}
                  className={`py-1.5 px-2 text-xs font-medium rounded border transition ${
                    roleSelection === "Trainer"
                      ? "bg-red-50 border-red-200 text-red-700 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Trainer
                </button>
                <button
                  type="button"
                  id="quick-member-login"
                  onClick={() => handleQuickLogin("Member")}
                  className={`py-1.5 px-2 text-xs font-medium rounded border transition ${
                    roleSelection === "Member"
                      ? "bg-red-50 border-red-200 text-red-700 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Member
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 text-center mt-3 leading-relaxed">
                Selecting a role updates the login email with an active profile from our preloaded 50+ members and 10+ trainers seed base.
              </p>
            </div>
          </form>
        )}

        {mode === "register" && (
          <form className="mt-8 space-y-6" onSubmit={handleRegisterSubmit}>
            <div className="rounded-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <UserIcon className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="pl-10 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white"
                    placeholder="James Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="pl-10 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white"
                    placeholder="james.smith@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="pl-10 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white"
                  placeholder="+1 (555) 012-3456"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs font-semibold text-red-600 hover:text-red-500"
              >
                Already have an account? Log in
              </button>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
              >
                Register Account
              </button>
            </div>
          </form>
        )}

        {mode === "forgot" && (
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Your Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm bg-white"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs font-semibold text-red-600 hover:text-red-500"
              >
                Back to login
              </button>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

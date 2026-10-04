/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "Administrator" | "Trainer" | "Member";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  profileId?: string; // Links to Member ID or Trainer ID if applicable
  registrationDate: string;
  isActive: boolean;
}

export interface Member {
  id: string;
  userId?: string;
  fullName: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  medicalNotes: string;
  height: number; // in cm
  weight: number; // in kg
  bmi: number;
  registrationDate: string;
  membershipPlanId: string;
  status: "Active" | "Expired" | "Pending" | "Suspended";
  photoUrl?: string;
}

export interface Trainer {
  id: string;
  userId?: string;
  fullName: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  specialty: string;
  certification: string;
  experience: number; // years
  salary: number;
  photoUrl?: string;
  availability: string; // e.g., "Mon-Fri (6 AM - 2 PM)"
}

export interface MembershipPlan {
  id: string;
  name: string;
  durationInDays: number;
  price: number;
  description: string;
  features: string[];
  isActive: boolean;
}

export interface Payment {
  invoiceNumber: string;
  memberId: string;
  memberName: string;
  planId: string;
  planName: string;
  amount: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: "Cash" | "Card" | "Mobile Money" | "Bank Transfer";
  paymentDate: string;
  dueDate: string;
  balance: number;
  receiptNumber: string;
  status: "Paid" | "Unpaid" | "Partial";
}

export interface FitnessClass {
  id: string;
  name: string;
  description: string;
  trainerId: string;
  trainerName: string;
  capacity: number;
  room: string;
  duration: string; // e.g., "60 mins"
  startTime: string; // e.g., "08:00 AM"
  endTime: string; // e.g., "09:00 AM"
  schedule: string[]; // e.g., ["Monday", "Wednesday", "Friday"]
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  status: "Active" | "Cancelled";
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  memberId: string;
  enrollmentDate: string;
}

export interface Attendance {
  id: string;
  memberId: string;
  memberName: string;
  classId: string;
  className: string;
  trainerId: string;
  trainerName: string;
  date: string; // YYYY-MM-DD
  isPresent: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  quantity: number;
  supplier: string;
  warrantyMonths: number;
  condition: "Excellent" | "Good" | "Fair" | "Damaged" | "Under Maintenance";
  maintenanceDate: string;
  status: "Active" | "Retired" | "Out of Order";
  location: string;
}

export interface EquipmentMaintenance {
  id: string;
  equipmentId: string;
  equipmentName: string;
  maintenanceDate: string;
  description: string;
  cost: number;
  performedBy: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "Expiry" | "Payment" | "Class" | "Trainer" | "Equipment" | "General";
  date: string;
  isRead: boolean;
  targetUserId?: string; // Empty means public/admin, specific ID for targeted
}

export interface AuditLog {
  id: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  details: string;
  date: string;
  time: string;
  ipAddress: string;
}

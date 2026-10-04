/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Member,
  Trainer,
  MembershipPlan,
  Payment,
  FitnessClass,
  ClassEnrollment,
  Attendance,
  Equipment,
  EquipmentMaintenance,
  SystemNotification,
  AuditLog,
  UserRole
} from "../types";

const STORAGE_KEY = "comfort_gym_db";

interface DatabaseState {
  users: User[];
  members: Member[];
  trainers: Trainer[];
  plans: MembershipPlan[];
  payments: Payment[];
  classes: FitnessClass[];
  enrollments: ClassEnrollment[];
  attendance: Attendance[];
  equipment: Equipment[];
  maintenance: EquipmentMaintenance[];
  notifications: SystemNotification[];
  auditLogs: AuditLog[];
}

// Lists for programmatically generating high-fidelity mock data
const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", 
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
  "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
  "Kenneth", "Carol", "Kevin", "Amanda", "Brian", "Dorothy", "George", "Melissa",
  "Timothy", "Deborah"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts"
];

const SPECIALTIES = [
  "Cardio Training", "Bodybuilding", "Yoga & Mindfulness", "Pilates", 
  "CrossFit", "Zumba & Aerobics", "Nutrition & Weight Loss", "Spinning / Cycling", 
  "HIIT Training", "Strength & Conditioning"
];

const CERTIFICATIONS = [
  "NASM Certified Personal Trainer", "ACE Certified Personal Trainer", "ISSA Personal Trainer Certification",
  "ACSM Certified Exercise Physiologist", "Yoga Alliance RYT 200", "CrossFit Level 2 Trainer",
  "NESTA Certified Personal Fitness Trainer", "CANFITPRO Personal Training Specialist"
];

const EQUIP_CATEGORIES = [
  "Cardio (Treadmill, Elliptical)", "Strength (Machines)", "Free Weights", 
  "Functional (Kettlebells, Bands)", "Accessories (Mats, Rollers)"
];

const SUPPLIERS = [
  "Life Fitness Corp", "Technogym USA", "Rogue Fitness", "Matrix Fitness Systems",
  "Precor Inc", "Hammer Strength", "Eleiko Sport"
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDateAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

// Generate the initial database state
function generateInitialDatabase(): DatabaseState {
  const db: DatabaseState = {
    users: [],
    members: [],
    trainers: [],
    plans: [],
    payments: [],
    classes: [],
    enrollments: [],
    attendance: [],
    equipment: [],
    maintenance: [],
    notifications: [],
    auditLogs: []
  };

  // 1. Create Default Users (including Roles)
  db.users.push({
    id: "U-ADMIN",
    email: "admin@comfortgym.com",
    fullName: "Chief Administrator",
    role: "Administrator",
    registrationDate: "2025-01-01",
    isActive: true
  });

  // 2. 8 Membership Plans
  const plansData: Omit<MembershipPlan, "id">[] = [
    { name: "Daily Pass", durationInDays: 1, price: 15, description: "Single-day access to gym facilities.", features: ["Locker access", "All gym equipment", "No contract"], isActive: true },
    { name: "Weekly Pass", durationInDays: 7, price: 45, description: "7 days of unlimited training access.", features: ["Locker access", "All gym equipment", "1 Fitness class voucher"], isActive: true },
    { name: "Standard Monthly", durationInDays: 30, price: 60, description: "Perfect monthly starter plan.", features: ["Locker access", "All gym equipment", "2 Fitness classes per week"], isActive: true },
    { name: "Premium Monthly", durationInDays: 30, price: 95, description: "All-inclusive monthly experience.", features: ["Locker access", "All gym equipment", "Unlimited fitness classes", "Sauna & pool access", "1 PT consult"], isActive: true },
    { name: "Quarterly Starter", durationInDays: 90, price: 160, description: "Commit to a 3-month cycle.", features: ["Locker access", "All gym equipment", "Unlimited fitness classes", "Sauna & pool access", "Free protein shaker"], isActive: true },
    { name: "Semi-Annual Goal", durationInDays: 180, price: 290, description: "6-month transformation schedule.", features: ["Locker access", "All gym equipment", "Unlimited fitness classes", "Sauna & pool access", "3 PT consults", "Guest passes"], isActive: true },
    { name: "Annual Core", durationInDays: 365, price: 499, description: "Full year of health optimization.", features: ["Locker access", "All gym equipment", "Unlimited fitness classes", "Sauna & pool access", "5 PT consults", "Unlimited guest passes", "10% juice bar discount"], isActive: true },
    { name: "Ultimate Annual VIP", durationInDays: 365, price: 799, description: "Ultra-premium fitness experience.", features: ["Locker access", "All gym equipment", "Unlimited fitness classes", "Sauna & pool access", "Weekly PT session", "Unlimited guest passes", "25% juice bar discount", "VIP apparel bundle"], isActive: true }
  ];

  plansData.forEach((p, idx) => {
    db.plans.push({
      ...p,
      id: `PLAN-00${idx + 1}`
    });
  });

  // 3. 10 Trainers
  const availabilitySlots = [
    "Mon-Fri (6 AM - 2 PM)",
    "Mon-Fri (2 PM - 10 PM)",
    "Sat-Sun (8 AM - 6 PM)",
    "Mon-Wed (6 AM - 2 PM), Sat (8 AM - 4 PM)",
    "Thu-Sat (2 PM - 10 PM)"
  ];

  for (let i = 1; i <= 10; i++) {
    const isFemale = i % 2 === 0;
    const firstName = getRandomItem(FIRST_NAMES.filter((_, idx) => (idx % 2 === 0) === isFemale));
    const lastName = getRandomItem(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@comfortgym.com`;
    const trainerId = `TRN-${String(i).padStart(3, "0")}`;
    const userId = `U-${trainerId}`;

    db.users.push({
      id: userId,
      email,
      fullName: `${firstName} ${lastName}`,
      role: "Trainer",
      profileId: trainerId,
      registrationDate: generateDateAgo(getRandomInt(100, 300)),
      isActive: true
    });

    db.trainers.push({
      id: trainerId,
      userId,
      fullName: `${firstName} ${lastName}`,
      gender: isFemale ? "Female" : "Male",
      phone: `+1 (555) 01${getRandomInt(10, 99)}-${getRandomInt(1000, 9999)}`,
      email,
      specialty: SPECIALTIES[i - 1] || getRandomItem(SPECIALTIES),
      certification: CERTIFICATIONS[(i - 1) % CERTIFICATIONS.length],
      experience: getRandomInt(2, 12),
      salary: getRandomInt(3200, 5800),
      availability: getRandomItem(availabilitySlots),
      photoUrl: `https://images.unsplash.com/photo-${isFemale ? "1494790108377-be9c29b29330" : "1500648767791-00dcc994a43e"}?auto=format&fit=crop&q=80&w=200`
    });
  }

  // 4. 50 Members
  for (let i = 1; i <= 50; i++) {
    const isFemale = i % 2 === 1;
    const firstName = getRandomItem(FIRST_NAMES.filter((_, idx) => (idx % 2 === 0) === isFemale));
    const lastName = getRandomItem(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomInt(10, 99)}@example.com`;
    const memberId = `MEM-${String(i).padStart(3, "0")}`;
    const userId = `U-${memberId}`;
    
    // Choose a random plan (Standard, Monthly, Quarterly, Annual, etc.)
    const plan = getRandomItem(db.plans);
    const regDaysAgo = getRandomInt(10, 250);
    const regDate = generateDateAgo(regDaysAgo);

    // Some members can have expired accounts
    const isExpired = regDaysAgo > plan.durationInDays && getRandomInt(1, 5) === 1;
    const status = isExpired ? "Expired" : "Active";

    db.users.push({
      id: userId,
      email,
      fullName: `${firstName} ${lastName}`,
      role: "Member",
      profileId: memberId,
      registrationDate: regDate,
      isActive: status === "Active"
    });

    const height = getRandomInt(155, 195);
    const weight = getRandomInt(55, 105);

    db.members.push({
      id: memberId,
      userId,
      fullName: `${firstName} ${lastName}`,
      gender: isFemale ? "Female" : "Male",
      dateOfBirth: generateDateAgo(getRandomInt(18 * 365, 55 * 365)), // 18-55 years old
      phone: `+1 (555) 02${getRandomInt(10, 99)}-${getRandomInt(1000, 9999)}`,
      email,
      address: `${getRandomInt(10, 999)} ${getRandomItem(["Broadway", "Main St", "Oak Ave", "Pine Rd", "Maple Blvd", "Ocean View"])}, Suite ${getRandomInt(1, 40)}`,
      emergencyContact: `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)} (${getRandomItem(["Parent", "Spouse", "Sibling", "Friend"])}) - +1 (555) 03${getRandomInt(10, 99)}-${getRandomInt(1000, 9999)}`,
      medicalNotes: getRandomInt(1, 10) > 8 ? getRandomItem(["Asthma (uses inhaler)", "Slight knee pain (careful with squats)", "Mild dust allergy"]) : "None",
      height,
      weight,
      bmi: calculateBMI(height, weight),
      registrationDate: regDate,
      membershipPlanId: plan.id,
      status,
      photoUrl: `https://images.unsplash.com/photo-${isFemale ? "1534528741775-53994a69daeb" : "1507003211169-0a1dd7228f2d"}?auto=format&fit=crop&q=80&w=200`
    });
  }

  // 5. 25 Classes
  const classNames = [
    { name: "Power Yoga Flow", category: "Yoga & Mindfulness", difficulty: "Intermediate" as const, room: "Studio A" },
    { name: "Beginner Vinyasa", category: "Yoga & Mindfulness", difficulty: "Beginner" as const, room: "Studio A" },
    { name: "Hardcore Bodybuilding", category: "Bodybuilding", difficulty: "Advanced" as const, room: "Iron Room" },
    { name: "Sculpt & Define", category: "Bodybuilding", difficulty: "Intermediate" as const, room: "Iron Room" },
    { name: "Cardio Blast HIIT", category: "HIIT Training", difficulty: "Intermediate" as const, room: "Studio B" },
    { name: "Ultimate CrossFit WOD", category: "CrossFit", difficulty: "Advanced" as const, room: "Functional Arena" },
    { name: "Zumba Party Mix", category: "Zumba & Aerobics", difficulty: "Beginner" as const, room: "Studio B" },
    { name: "Spins & Rhythm", category: "Spinning / Cycling", difficulty: "Intermediate" as const, room: "Cycling Hub" },
    { name: "Ab Shred & Core", category: "Strength & Conditioning", difficulty: "Beginner" as const, room: "Studio A" },
    { name: "Glute Burnout", category: "Strength & Conditioning", difficulty: "Intermediate" as const, room: "Studio B" },
    { name: "Powerlifting Essentials", category: "Strength & Conditioning", difficulty: "Advanced" as const, room: "Iron Room" },
    { name: "Sunrise Pilates", category: "Pilates", difficulty: "Beginner" as const, room: "Studio A" }
  ];

  const classSchedules = [
    ["Monday", "Wednesday"],
    ["Tuesday", "Thursday"],
    ["Monday", "Wednesday", "Friday"],
    ["Saturday", "Sunday"],
    ["Tuesday", "Thursday", "Saturday"]
  ];

  const classHours = [
    { start: "07:00 AM", end: "08:00 AM" },
    { start: "08:30 AM", end: "09:30 AM" },
    { start: "10:00 AM", end: "11:00 AM" },
    { start: "12:00 PM", end: "01:00 PM" },
    { start: "04:30 PM", end: "05:30 PM" },
    { start: "06:00 PM", end: "07:00 PM" },
    { start: "07:30 PM", end: "08:30 PM" }
  ];

  for (let i = 1; i <= 25; i++) {
    const classMeta = classNames[(i - 1) % classNames.length];
    const trainer = db.trainers[(i - 1) % db.trainers.length];
    const hour = classHours[(i - 1) % classHours.length];
    const schedule = classSchedules[(i - 1) % classSchedules.length];
    const classId = `CLS-${String(i).padStart(3, "0")}`;

    db.classes.push({
      id: classId,
      name: `${classMeta.name} (${String(i)})`,
      description: `A fast-paced and challenging physical routine focused on ${classMeta.category}. Designed for maximum results in a motivating environment.`,
      trainerId: trainer.id,
      trainerName: trainer.fullName,
      capacity: getRandomInt(15, 30),
      room: classMeta.room,
      duration: "60 mins",
      startTime: hour.start,
      endTime: hour.end,
      schedule,
      difficulty: classMeta.difficulty,
      status: getRandomInt(1, 15) === 15 ? "Cancelled" : "Active"
    });
  }

  // 6. 100 Payments
  // Let's generate historical payments for members
  let invoiceCounter = 10001;
  let receiptCounter = 50001;

  for (let i = 1; i <= 100; i++) {
    const member = db.members[(i - 1) % db.members.length];
    const plan = db.plans.find(p => p.id === member.membershipPlanId) || db.plans[0];
    
    const paymentDaysAgo = getRandomInt(1, 200);
    const paymentDate = generateDateAgo(paymentDaysAgo);
    const dueDate = generateDateAgo(paymentDaysAgo - plan.durationInDays);

    const discount = getRandomInt(1, 10) > 8 ? getRandomItem([5, 10, 15]) : 0;
    const baseAmount = plan.price;
    const discountAmount = parseFloat(((baseAmount * discount) / 100).toFixed(2));
    const tax = parseFloat(((baseAmount - discountAmount) * 0.08).toFixed(2));
    const totalAmount = parseFloat((baseAmount - discountAmount + tax).toFixed(2));

    const method = getRandomItem(["Cash", "Card", "Mobile Money", "Bank Transfer"] as const);
    const isPaid = paymentDaysAgo > 0;

    db.payments.push({
      invoiceNumber: `INV-${invoiceCounter++}`,
      memberId: member.id,
      memberName: member.fullName,
      planId: plan.id,
      planName: plan.name,
      amount: baseAmount,
      discount: discountAmount,
      tax,
      totalAmount,
      paymentMethod: method,
      paymentDate: paymentDate,
      dueDate: dueDate,
      balance: 0,
      receiptNumber: `RCP-${receiptCounter++}`,
      status: isPaid ? "Paid" : "Unpaid"
    });
  }

  // 7. 100 Equipment Records
  const cardioBrand = ["Life Fitness", "Precor", "NordicTrack", "Peloton", "Technogym"];
  const strengthBrand = ["Hammer Strength", "Cybex", "Matrix", "Body-Solid", "Technogym"];
  const weightNames = [
    "Olympic Barbell", "Cast Iron Dumbbell Pair", "Rubber Bumper Plates Set", 
    "Hex Dumbbell Set", "Kettlebell Pro Set", "Adjustable Weight Bench", 
    "Power Cage / Squat Rack", "Cable Crossover Machine", "Lat Pulldown Station", 
    "Leg Press Machine", "Smith Machine", "Preacher Curl Bench"
  ];

  const cardioNames = [
    "Treadmill Integrity Series", "Elliptical Cross Trainer", "Upright Lifecycle Bike", 
    "Recumbent Bike", "Concept2 RowErg", "StairMaster Gauntlet", "Assault AirBike Pro"
  ];

  const accessoriesNames = [
    "Premium Yoga Mat", "High-Density Foam Roller", "Resistance Bands Set", 
    "Medicine Ball Set", "Suspension Trainer (TRX style)", "Gymnastic Rings"
  ];

  for (let i = 1; i <= 100; i++) {
    const equipId = `EQP-${String(i).padStart(3, "0")}`;
    const categoryId = i % 5;
    let name = "";
    let category = "";
    let price = 0;
    let location = "";

    if (categoryId === 0) {
      category = EQUIP_CATEGORIES[0]; // Cardio
      name = `${getRandomItem(cardioBrand)} ${getRandomItem(cardioNames)}`;
      price = getRandomInt(1200, 4500);
      location = "Cardio Zone";
    } else if (categoryId === 1 || categoryId === 2) {
      category = EQUIP_CATEGORIES[1]; // Strength
      name = `${getRandomItem(strengthBrand)} ${getRandomItem(weightNames)}`;
      price = getRandomInt(800, 3200);
      location = "Strength Section";
    } else if (categoryId === 3) {
      category = EQUIP_CATEGORIES[2]; // Free weights
      name = getRandomItem(weightNames);
      price = getRandomInt(150, 1500);
      location = "Free Weights Area";
    } else {
      category = getRandomItem([EQUIP_CATEGORIES[3], EQUIP_CATEGORIES[4]]); // Functional / Accessories
      name = getRandomItem(accessoriesNames);
      price = getRandomInt(40, 350);
      location = "Functional Training Arena";
    }

    const buyDaysAgo = getRandomInt(30, 700);
    const purchaseDate = generateDateAgo(buyDaysAgo);
    
    // Condition
    let condition: Equipment["condition"] = "Excellent";
    let status: Equipment["status"] = "Active";

    if (buyDaysAgo > 500) {
      condition = getRandomItem(["Fair", "Damaged", "Under Maintenance"]);
    } else if (buyDaysAgo > 250) {
      condition = getRandomItem(["Good", "Fair"]);
    } else {
      condition = getRandomItem(["Excellent", "Good"]);
    }

    if (condition === "Damaged") {
      status = "Out of Order";
    } else if (condition === "Under Maintenance") {
      status = "Retired"; // Or locked in maintenance
    }

    db.equipment.push({
      id: equipId,
      name,
      category,
      purchaseDate,
      purchasePrice: price,
      quantity: getRandomInt(1, 8),
      supplier: getRandomItem(SUPPLIERS),
      warrantyMonths: getRandomItem([12, 24, 36, 48]),
      condition,
      maintenanceDate: generateDateAgo(getRandomInt(5, 60)),
      status,
      location
    });
  }

  // 8. 500 Attendance Records
  // Map members to some classes they enrolled in
  const activeMembers = db.members.filter(m => m.status === "Active");
  const activeClasses = db.classes.filter(c => c.status === "Active");
  
  let attendanceCounter = 1;

  // Let's create actual class schedules in a range of dates
  // and log attendance for some members
  for (let daysAgo = 1; daysAgo <= 20; daysAgo++) {
    const dateStr = generateDateAgo(daysAgo);
    const dayOfWeek = new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });

    // Find classes scheduled for this weekday
    const scheduledClasses = activeClasses.filter(c => c.schedule.includes(dayOfWeek));

    scheduledClasses.forEach(c => {
      // Pick 5-12 random active members to attend
      const size = getRandomInt(5, 12);
      const attendants: Member[] = [];
      while (attendants.length < size) {
        const candidate = getRandomItem(activeMembers);
        if (!attendants.find(a => a.id === candidate.id)) {
          attendants.push(candidate);
        }
      }

      attendants.forEach(member => {
        if (attendanceCounter > 500) return;

        db.attendance.push({
          id: `ATT-${String(attendanceCounter++).padStart(4, "0")}`,
          memberId: member.id,
          memberName: member.fullName,
          classId: c.id,
          className: c.name,
          trainerId: c.trainerId,
          trainerName: c.trainerName,
          date: dateStr,
          isPresent: getRandomInt(1, 10) > 1 // 90% attendance rate
        });
      });
    });
  }

  // If we still need to fill to reach 500 records exactly:
  while (attendanceCounter <= 500) {
    const member = getRandomItem(db.members);
    const c = getRandomItem(db.classes);
    db.attendance.push({
      id: `ATT-${String(attendanceCounter++).padStart(4, "0")}`,
      memberId: member.id,
      memberName: member.fullName,
      classId: c.id,
      className: c.name,
      trainerId: c.trainerId,
      trainerName: c.trainerName,
      date: generateDateAgo(getRandomInt(1, 30)),
      isPresent: getRandomInt(1, 10) > 2
    });
  }

  // 9. Create standard Enrollments
  db.members.forEach((member, index) => {
    // Enroll members in 1-3 random classes
    const classCount = getRandomInt(1, 3);
    const chosenClasses: string[] = [];
    for (let j = 0; j < classCount; j++) {
      const cls = getRandomItem(db.classes);
      if (!chosenClasses.includes(cls.id)) {
        chosenClasses.push(cls.id);
        db.enrollments.push({
          id: `ENR-${member.id}-${cls.id}`,
          classId: cls.id,
          memberId: member.id,
          enrollmentDate: member.registrationDate
        });
      }
    }
  });

  // 10. Notifications
  db.notifications.push({
    id: "N-001",
    title: "Membership Expiry Reminder",
    message: "Member James Smith (MEM-001) is expiring in 3 days.",
    type: "Expiry",
    date: generateDateAgo(0),
    isRead: false
  });
  db.notifications.push({
    id: "N-002",
    title: "Equipment Maintenance Alert",
    message: "Treadmill Integrity Series (EQP-001) is scheduled for monthly service tomorrow.",
    type: "Equipment",
    date: generateDateAgo(0),
    isRead: false
  });
  db.notifications.push({
    id: "N-003",
    title: "Trainer Assignment",
    message: "Trainer Patricia Garcia has been assigned to Sunrise Pilates (CLS-012).",
    type: "Trainer",
    date: generateDateAgo(1),
    isRead: true
  });

  // 11. Initial Audit Logs
  db.auditLogs.push({
    id: "LOG-001",
    userEmail: "system@comfortgym.com",
    userRole: "Administrator",
    action: "System Initialization",
    details: "Initialized database with 50 members, 10 trainers, 8 plans, 25 classes, 100 equipment, 100 payments, and 500 attendance entries.",
    date: generateDateAgo(0),
    time: "08:00 AM",
    ipAddress: "127.0.0.1"
  });

  return db;
}

// Get the DB or initialize it
export function getDb(): DatabaseState {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      return JSON.parse(localData);
    } catch (e) {
      console.error("Error parsing GMS database, reinitializing...", e);
    }
  }
  const freshDb = generateInitialDatabase();
  saveDb(freshDb);
  return freshDb;
}

export function saveDb(db: DatabaseState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Logs actions automatically
export function logAction(userEmail: string, role: UserRole, action: string, details: string): void {
  const db = getDb();
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toISOString().split("T")[0];

  const log: AuditLog = {
    id: `LOG-${String(db.auditLogs.length + 1).padStart(4, "0")}-${getRandomInt(100, 999)}`,
    userEmail,
    userRole: role,
    action,
    details,
    date: dateStr,
    time: timeStr,
    ipAddress: "192.168.1." + getRandomInt(2, 254)
  };

  db.auditLogs.unshift(log);
  // Cap at 1000 logs
  if (db.auditLogs.length > 1000) {
    db.auditLogs.pop();
  }
  saveDb(db);
}

// Triggers system notifications
export function addNotification(title: string, message: string, type: SystemNotification["type"], targetUserId?: string): void {
  const db = getDb();
  const notif: SystemNotification = {
    id: `N-${String(db.notifications.length + 1).padStart(4, "0")}-${getRandomInt(10, 99)}`,
    title,
    message,
    type,
    date: new Date().toISOString().split("T")[0],
    isRead: false,
    targetUserId
  };
  db.notifications.unshift(notif);
  saveDb(db);
}

// import "dotenv/config";

// import { CompanyAction, InternshipStatus, PrismaClient, StatusType, StudentApprovalStatus, TrainingType, UniversityAction, UserAction, UserRole } from "@prisma/client";
// import * as argon2 from "argon2";
// import { PrismaPg } from "@prisma/adapter-pg";

// const adapter = new PrismaPg({
//     connectionString: process.env.DATABASE_URL!,
// });

// const prisma = new PrismaClient({
//     adapter,
// });


// // -------------------------------------
// // HELPERS
// // -------------------------------------
// let personalIdCounter = 100000000;

// function generatePersonalId() {
//     return personalIdCounter++;
// }

// let recoveryEmailCounter = 0;

// function buildRecoveryEmail(firstName: string, lastName: string): string {
//     const base = `${firstName.toLowerCase().replace(/\s+/g, "")}${lastName
//         .toLowerCase()
//         .replace(/\s+/g, "")}`;
//     return `${base}${recoveryEmailCounter++}@gmail.com`;
// }

// function buildEmail(first: string, last: string, code: string) {
//     return `${first.toLowerCase().replace(/\s+/g, "")}.${last
//         .toLowerCase()
//         .replace(/\s+/g, "")}.${code.toLowerCase()}@tadreeby.com`;
// }

// function getRandomDateInMonth(year: number, month: number): Date {
//     const daysInMonth = new Date(year, month + 1, 0).getDate();
//     const day = Math.floor(Math.random() * daysInMonth) + 1;
//     return new Date(
//         year,
//         month,
//         day,
//         Math.floor(Math.random() * 12) + 8,
//         Math.floor(Math.random() * 60)
//     );
// }

// const trainingTypes: TrainingType[] = ["ONSITE", "REMOTE", "HYBRID"];

// // -------------------------------------
// // DATA
// // -------------------------------------
// const universities = [
//     { name: "Al-Azhar University", shortCode: "AZU" },
//     { name: "Palestine University", shortCode: "PLU" },
//     { name: "Al-Aqsa University", shortCode: "AQU" },
//     { name: "Islamic University of Gaza", shortCode: "IUG" }, // جديد
//     { name: "University of Palestine", shortCode: "UOP" },   // جديد
// ];

// const companies = [
//     { name: "Tadreeby Tech", shortCode: "TAD" },
//     { name: "Future Labs", shortCode: "FUT" },
//     { name: "CodeCraft", shortCode: "COD" },
//     { name: "DataNest", shortCode: "DAT" },
//     { name: "CloudWave", shortCode: "CLW" },
// ];

// // -------------------------------------
// // MAIN
// // -------------------------------------
// async function main() {
//     console.log("🌱 Seeding started...");
//     const defaultHashed = await argon2.hash("S3cure@Tadreeby2026");

//     // ========== UNIVERSITIES ==========
//     console.log("📚 Creating universities...");
//     const createdUniversities: any[] = [];
//     for (const uni of universities) {
//         const university = await prisma.university.create({
//             data: {
//                 name: uni.name,
//                 shortCode: uni.shortCode.toLowerCase(),
//                 email: `admin.${uni.shortCode.toLowerCase()}@tadreeby.com`,
//                 isActive: true,
//             },
//         });
//         createdUniversities.push(university);
//         await prisma.universityAuditLog.create({
//             data: {
//                 universityId: university.id,
//                 action: UniversityAction.CREATED,
//                 performedBy: 1,
//                 newValue: { name: university.name, shortCode: university.shortCode },
//             },
//         });
//         console.log(`  ✅ Created university: ${uni.name}`);
//     }

//     // ========== COMPANIES ==========
//     console.log("🏢 Creating companies...");
//     const createdCompanies: any[] = [];
//     for (const comp of companies) {
//         const company = await prisma.company.create({
//             data: {
//                 name: comp.name,
//                 shortCode: comp.shortCode.toLowerCase(),
//                 email: `admin.${comp.shortCode.toLowerCase()}@tadreeby.com`,
//                 isActive: true,
//             },
//         });
//         createdCompanies.push(company);
//         await prisma.companyAuditLog.create({
//             data: {
//                 companyId: company.id,
//                 action: CompanyAction.CREATED,
//                 performedBy: 1,
//                 newValue: { name: company.name, shortCode: company.shortCode },
//             },
//         });
//         console.log(`  ✅ Created company: ${comp.name}`);
//     }

//     // ========== SUPER ADMIN ==========
//     console.log("👑 Creating Super Admin...");
//     const superAdmin = await prisma.user.create({
//         data: {
//             firstName: "Shahd",
//             lastName: "Sharif",
//             email: buildEmail("shahd", "sharif", "admin"),
//             password: defaultHashed,
//             role: UserRole.SUPER_ADMIN,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("shahd", "abusharife"),
//         },
//     });
//     console.log("  ✅ Created Super Admin");

//     await prisma.userStatus.create({
//         data: {
//             userId: superAdmin.id,
//             status: StatusType.OFFLINE,
//             lastSeen: new Date(),
//         },
//     });

//     await prisma.userActivityLog.create({
//         data: {
//             userId: superAdmin.id,
//             action: UserAction.LOGIN,
//             ipAddress: "127.0.0.1",
//             userAgent: "Seed Script",
//             deviceInfo: "Local Seed",
//         },
//     });

//     // Update audit logs with correct performedBy
//     await prisma.universityAuditLog.updateMany({
//         where: { performedBy: 1 },
//         data: { performedBy: superAdmin.id },
//     });
//     await prisma.companyAuditLog.updateMany({
//         where: { performedBy: 1 },
//         data: { performedBy: superAdmin.id },
//     });

//     // ========== UNIVERSITY ADMINS ==========
//     console.log("🎓 Creating University Admins...");
//     const uniAdmins = [
//         { first: "Ahmad", last: "Khaled" },
//         { first: "Sara", last: "Mahmoud" },
//         { first: "Yousef", last: "Ali" },
//         { first: "Mona", last: "Hassan" },
//         { first: "Rami", last: "Nasser" },
//     ];
//     for (let i = 0; i < createdUniversities.length; i++) {
//         const uni = createdUniversities[i];
//         const admin = uniAdmins[i % uniAdmins.length];
//         const user = await prisma.user.create({
//             data: {
//                 firstName: admin.first,
//                 lastName: admin.last,
//                 email: buildEmail(admin.first, admin.last, uni.shortCode),
//                 password: defaultHashed,
//                 role: UserRole.UNIVERSITY_ADMIN,
//                 universityId: uni.id,
//                 personalID: generatePersonalId(),
//                 isActive: true,
//                 recoveryEmail: buildRecoveryEmail(admin.first, admin.last),
//             },
//         });
//         await prisma.userStatus.create({
//             data: {
//                 userId: user.id,
//                 status: StatusType.OFFLINE,
//                 lastSeen: new Date(),
//             },
//         });
//         console.log(
//             `  ✅ Created University Admin: ${admin.first} ${admin.last} for ${uni.name}`
//         );
//     }

//     // ========== UNIVERSITY SUPERVISORS ==========
//     console.log("👨‍🏫 Creating University Supervisors...");
//     const supervisors = [
//         { first: "Nadine", last: "Saleh" },
//         { first: "Mahmoud", last: "Faraj" },
//         { first: "Lina", last: "Hussein" },
//         { first: "Khalil", last: "Abu Odeh" },
//         { first: "Diana", last: "Khalil" },
//     ];
//     for (let i = 0; i < createdUniversities.length; i++) {
//         const uni = createdUniversities[i];
//         const s = supervisors[i % supervisors.length];
//         const user = await prisma.user.create({
//             data: {
//                 firstName: s.first,
//                 lastName: s.last,
//                 email: buildEmail(s.first, s.last, uni.shortCode),
//                 password: defaultHashed,
//                 role: UserRole.UNIVERSITY_SUPERVISOR,
//                 universityId: uni.id,
//                 personalID: generatePersonalId(),
//                 isActive: true,
//                 recoveryEmail: buildRecoveryEmail(s.first, s.last),
//                 supervisorProfile: {
//                     create: {
//                         universityId: uni.id,
//                         department: ["Computer Science", "Software Engineering", "Data Science"][i % 3],
//                     },
//                 },
//             },
//         });
//         await prisma.userStatus.create({
//             data: {
//                 userId: user.id,
//                 status: StatusType.OFFLINE,
//                 lastSeen: new Date(),
//             },
//         });
//         console.log(
//             `  ✅ Created University Supervisor: ${s.first} ${s.last} for ${uni.name}`
//         );
//     }

//     // ========== COMPANY ADMINS ==========
//     console.log("💼 Creating Company Admins...");
//     const companyAdmins = [
//         { first: "Khalil", last: "Nasser" },
//         { first: "Rana", last: "Odeh" },
//         { first: "Samer", last: "Hammad" },
//         { first: "Lama", last: "Jaber" },
//         { first: "Zaid", last: "Abu Shaban" },
//     ];
//     for (let i = 0; i < createdCompanies.length; i++) {
//         const comp = createdCompanies[i];
//         const admin = companyAdmins[i % companyAdmins.length];
//         const user = await prisma.user.create({
//             data: {
//                 firstName: admin.first,
//                 lastName: admin.last,
//                 email: buildEmail(admin.first, admin.last, comp.shortCode),
//                 password: defaultHashed,
//                 role: UserRole.COMPANY_ADMIN,
//                 companyId: comp.id,
//                 personalID: generatePersonalId(),
//                 isActive: true,
//                 recoveryEmail: buildRecoveryEmail(admin.first, admin.last),
//             },
//         });
//         await prisma.userStatus.create({
//             data: {
//                 userId: user.id,
//                 status: StatusType.OFFLINE,
//                 lastSeen: new Date(),
//             },
//         });
//         console.log(
//             `  ✅ Created Company Admin: ${admin.first} ${admin.last} for ${comp.name}`
//         );
//     }

//     // ========== COMPANY TRAINERS ==========
//     console.log("🧑‍💼 Creating Company Trainers...");
//     const trainers = [
//         { first: "Hani", last: "Abu Salem" },
//         { first: "Dalia", last: "Khoury" },
//         { first: "Yara", last: "Massoud" },
//         { first: "Firas", last: "Zaytoun" },
//         { first: "Samar", last: "Al-Barghouti" },
//     ];
//     for (let i = 0; i < createdCompanies.length; i++) {
//         const comp = createdCompanies[i];
//         const t = trainers[i % trainers.length];
//         const user = await prisma.user.create({
//             data: {
//                 firstName: t.first,
//                 lastName: t.last,
//                 email: buildEmail(t.first, t.last, comp.shortCode),
//                 password: defaultHashed,
//                 role: UserRole.COMPANY_TRAINER,
//                 companyId: comp.id,
//                 personalID: generatePersonalId(),
//                 isActive: true,
//                 recoveryEmail: buildRecoveryEmail(t.first, t.last),
//                 trainerProfile: {
//                     create: {
//                         companyId: comp.id,
//                         position: ["Senior Trainer", "Tech Lead", "Mentor"][i % 3],
//                         specialization: ["Full Stack", "DevOps", "Data Science"][i % 3],
//                     },
//                 },
//             },
//         });
//         await prisma.userStatus.create({
//             data: {
//                 userId: user.id,
//                 status: StatusType.OFFLINE,
//                 lastSeen: new Date(),
//             },
//         });
//         console.log(
//             `  ✅ Created Company Trainer: ${t.first} ${t.last} for ${comp.name}`
//         );
//     }

//     // ========== STUDENTS (1500) ==========
//     console.log("👨‍🎓 Creating 1500 Students...");
//     const studentFirstNames = [
//         "Mohammad", "Ahmed", "Sara", "Yousef", "Lina", "Omar", "Nour", "Layla",
//         "Kareem", "Mona", "Ali", "Huda", "Ibrahim", "Fatima", "Hassan", "Aisha",
//         "Khaled", "Amira", "Tamer", "Dina", "Rami", "Nadia", "Samer", "Rana",
//         "Bassam", "Maya", "Zain", "Leen", "Fadi", "Sana",
//     ];
//     const majors = [
//         "Backend Developer", "Frontend Developer", "UX/UI Designer",
//         "Network Engineer", "Data Scientist", "DevOps Engineer",
//         "Mobile Developer", "Security Analyst", "Cloud Engineer",
//         "Full Stack Developer", "AI Engineer", "Database Administrator",
//         "Systems Analyst", "Software Tester", "Product Manager",
//         "Cybersecurity", "Embedded Systems", "Game Development",
//     ];

//     const createdStudents: any[] = [];
//     for (let i = 0; i < 1500; i++) {
//         const uni = createdUniversities[i % createdUniversities.length];
//         const firstName = studentFirstNames[i % studentFirstNames.length];
//         const lastName = `User${i}`;
//         const major = majors[i % majors.length];

//         const user = await prisma.user.create({
//             data: {
//                 firstName,
//                 lastName,
//                 email: `student.${i}@test.com`,
//                 password: defaultHashed,
//                 role: UserRole.STUDENT,
//                 universityId: uni.id,
//                 personalID: generatePersonalId(),
//                 isActive: true,
//                 recoveryEmail: buildRecoveryEmail(firstName, lastName),
//                 studentProfile: {
//                     create: {
//                         universityId: uni.id,
//                         studentNumber: 20260000 + i,
//                         major,
//                         academicYear: (i % 4) + 1,
//                         gpa: 2.5 + (i % 5) * 0.3,
//                         approvalStatus: StudentApprovalStatus.APPROVED,
//                         approvedAt: new Date(),
//                         verificationDocument: "seed-file.pdf",
//                     },
//                 },
//             },
//         });
//         createdStudents.push(user);
//         if (i % 100 === 0) console.log(`  ✅ Created ${i + 1} students...`);
//         if (i < 50) {
//             await prisma.userStatus.create({
//                 data: {
//                     userId: user.id,
//                     status: i < 10 ? StatusType.ONLINE : StatusType.OFFLINE,
//                     lastSeen: new Date(),
//                 },
//             });
//         }
//     }
//     console.log(`  ✅ Total Students: ${createdStudents.length}`);

//     // ========== TRAINING OPPORTUNITIES (20) ==========
//     console.log("📋 Creating 20 Training Opportunities...");
//     const skillSets = [
//         "JavaScript,React,Node.js,Express",
//         "Python,Django,PostgreSQL,REST",
//         "Java,Spring Boot,AWS,Microservices",
//         "React,TypeScript,Tailwind,Next.js",
//         "Python,Flask,MongoDB,Docker",
//         "C#,.NET,Azure,SQL",
//         "Angular,JavaScript,Node.js,MongoDB",
//         "Python,Data Science,NumPy,Pandas",
//         "Go,Docker,Kubernetes,CI/CD",
//         "PHP,Laravel,Vue.js,MySQL",
//         "React Native,Mobile,Firebase",
//         "Python,Django,GraphQL,PostgreSQL",
//         "Java,Spring,Cloud,Microservices",
//         "JavaScript,React,Redux,Webpack",
//         "Python,Flask,SQLAlchemy,PostgreSQL",
//         "C++,Qt,Embedded,Linux",
//         "Ruby,Rails,PostgreSQL,Heroku",
//         "Swift,iOS,Firebase",
//         "Kotlin,Android,Jetpack",
//         "R,Statistics,DataViz,Python",
//     ];

//     const titles = [
//         "Frontend Developer Intern",
//         "Backend Engineer Intern",
//         "Full Stack Developer Intern",
//         "Data Science Intern",
//         "DevOps Engineer Intern",
//         "Mobile App Developer Intern",
//         "UI/UX Designer Intern",
//         "Security Analyst Intern",
//         "Cloud Engineer Intern",
//         "AI/ML Intern",
//         "Database Administrator Intern",
//         "Systems Analyst Intern",
//         "Software Tester Intern",
//         "Product Manager Intern",
//         "Cybersecurity Intern",
//         "Embedded Systems Intern",
//         "Game Developer Intern",
//         "Ruby on Rails Intern",
//         "iOS Developer Intern",
//         "Android Developer Intern",
//     ];

//     const createdOpportunities: any[] = [];
//     for (let i = 0; i < 20; i++) {
//         const comp = createdCompanies[i % createdCompanies.length];
//         const type = trainingTypes[Math.floor(Math.random() * trainingTypes.length)];
//         const opp = await prisma.trainingOpportunity.create({
//             data: {
//                 companyId: comp.id,
//                 title: titles[i],
//                 description: `Internship program for ${titles[i]} at ${comp.name}. Hands-on experience with real projects.`,
//                 requiredSkills: skillSets[i],
//                 duration: `${(i % 6) + 3} months`,
//                 totalSeats: Math.floor(Math.random() * 15) + 10,
//                 isActive: true,
//                 type: type,
//             },
//         });
//         createdOpportunities.push(opp);
//         console.log(`  ✅ Created: ${titles[i]} (${type})`);
//     }

//     // ========== INTERNSHIPS ==========
//     console.log("📝 Creating Internships...");
//     const trainerUsers = await prisma.user.findMany({
//         where: { role: UserRole.COMPANY_TRAINER },
//     });
//     const supervisorUsers = await prisma.user.findMany({
//         where: { role: UserRole.UNIVERSITY_SUPERVISOR },
//     });

//     const internshipStatuses = [
//         InternshipStatus.ACTIVE,
//         InternshipStatus.ACTIVE,
//         InternshipStatus.COMPLETED,
//         InternshipStatus.COMPLETED,
//         InternshipStatus.CLOSED,
//         InternshipStatus.ACTIVE,
//         InternshipStatus.COMPLETED,
//         InternshipStatus.CLOSED,
//         InternshipStatus.ACTIVE,
//         InternshipStatus.COMPLETED,
//         InternshipStatus.ACTIVE,
//         InternshipStatus.ACTIVE,
//         InternshipStatus.COMPLETED,
//         InternshipStatus.CLOSED,
//         InternshipStatus.ACTIVE,
//         InternshipStatus.COMPLETED,
//         InternshipStatus.CLOSED,
//         InternshipStatus.ACTIVE,
//         InternshipStatus.COMPLETED,
//         InternshipStatus.ACTIVE,
//     ];

//     const createdInternships: any[] = [];
//     for (let i = 0; i < createdOpportunities.length; i++) {
//         const opp = createdOpportunities[i];
//         const uni = createdUniversities[i % createdUniversities.length];
//         const status = internshipStatuses[i % internshipStatuses.length];
//         const trainer = trainerUsers[i % trainerUsers.length] || null;
//         const supervisor = supervisorUsers[i % supervisorUsers.length] || null;

//         const internship = await prisma.internship.create({
//             data: {
//                 opportunityId: opp.id,
//                 companyId: opp.companyId,
//                 universityId: uni.id,
//                 status: status,
//                 trainerId: trainer?.id || undefined,
//                 supervisorId: supervisor?.id || undefined,
//             },
//         });
//         createdInternships.push(internship);
//         console.log(`  ✅ Created Internship #${internship.id} for "${opp.title}"`);
//     }

//     // ========== INTERNSHIP STUDENTS (unique) ==========
//     console.log("📊 Creating Internship Applications (guaranteed unique)...");
//     const applicationsPerMonth = [
//         { month: 0, count: 620 },   // Jan
//         { month: 1, count: 810 },   // Feb
//         { month: 2, count: 980 },   // Mar
//         { month: 3, count: 1120 },  // Apr
//         { month: 4, count: 1246 },  // May
//         { month: 5, count: 1090 },  // Jun
//     ];

//     const usedPairs = new Set<string>();
//     let totalApplications = 0;

//     for (const appData of applicationsPerMonth) {
//         const { month, count } = appData;
//         const year = 2026;
//         let created = 0;
//         let attempts = 0;
//         const maxAttempts = count * 10; // أمان لتفادي حلقة لا نهائية

//         while (created < count && attempts < maxAttempts) {
//             attempts++;
//             const student = createdStudents[Math.floor(Math.random() * createdStudents.length)];
//             const internship = createdInternships[Math.floor(Math.random() * createdInternships.length)];
//             const key = `${student.id}-${internship.id}`;

//             if (!usedPairs.has(key)) {
//                 usedPairs.add(key);
//                 const createdAt = getRandomDateInMonth(year, month);
//                 await prisma.internshipStudent.create({
//                     data: {
//                         internshipId: internship.id,
//                         studentId: student.id,
//                         createdAt: createdAt,
//                     },
//                 });
//                 created++;
//                 totalApplications++;
//             }
//         }
//         const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
//         console.log(`  ✅ Created ${created} applications for ${monthNames[month]} ${year}`);
//     }

//     console.log(`  ✅ Total applications created: ${totalApplications}`);

//     // ========== FINAL SUMMARY ==========
//     console.log("\n✅ Seeding completed successfully!");
//     console.log("📊 Summary:");
//     console.log(`  - ${createdUniversities.length} Universities`);
//     console.log(`  - ${createdCompanies.length} Companies`);
//     console.log(`  - 1 Super Admin`);
//     console.log(`  - ${uniAdmins.length} University Admins (with repetition)`);
//     console.log(`  - ${supervisors.length} University Supervisors (with repetition)`);
//     console.log(`  - ${companyAdmins.length} Company Admins (with repetition)`);
//     console.log(`  - ${trainers.length} Company Trainers (with repetition)`);
//     console.log(`  - ${createdStudents.length} Students`);
//     console.log(`  - ${createdOpportunities.length} Training Opportunities`);
//     console.log(`  - ${createdInternships.length} Internships`);
//     console.log(`  - ${totalApplications} Internship Applications (${applicationsPerMonth.reduce((s, a) => s + a.count, 0)} total)`);
//     console.log(`  - ${await prisma.userStatus.count()} User Statuses`);
//     console.log(`  - ${await prisma.userActivityLog.count()} User Activity Logs`);
//     console.log(`  - ${await prisma.universityAuditLog.count()} University Audit Logs`);
//     console.log(`  - ${await prisma.companyAuditLog.count()} Company Audit Logs`);
// }

// main()
//     .catch((e) => {
//         console.error("❌ Seeding failed:", e);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });


import "dotenv/config";

import {
    CompanyAction,
    InternshipStatus,
    PrismaClient,
    StatusType,
    StudentApprovalStatus,
    TrainingType,
    UniversityAction,
    UserAction,
    UserRole,
    AttendanceStatus,
    TaskStatus,
    EvaluationType,
} from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

import "dotenv/config";

// -------------------------------------
// HELPERS (minimal)
// -------------------------------------
let personalIdCounter = 100000000;
function generatePersonalId() {
    return personalIdCounter++;
}

let recoveryEmailCounter = 0;
function buildRecoveryEmail(firstName: string, lastName: string): string {
    const base = `${firstName.toLowerCase().replace(/\s+/g, "")}${lastName
        .toLowerCase()
        .replace(/\s+/g, "")}`;
    return `${base}${recoveryEmailCounter++}@gmail.com`;
}

function buildEmail(first: string, last: string, code: string) {
    return `${first.toLowerCase().replace(/\s+/g, "")}.${last
        .toLowerCase()
        .replace(/\s+/g, "")}.${code.toLowerCase()}@tadreeby.com`;
}

// -------------------------------------
// CLEANUP (idempotent seed)
// -------------------------------------
async function cleanup() {
    console.log("🧹 Cleaning up existing data...");

    // Order matters: children before parents
    await prisma.aIEvaluation.deleteMany();
    await prisma.taskSubmission.deleteMany();
    await prisma.task.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.internshipStudent.deleteMany();
    await prisma.internship.deleteMany();
    await prisma.application.deleteMany();
    await prisma.trainingOpportunity.deleteMany();
    await prisma.supervisorStudent.deleteMany();
    await prisma.universitySupervisorProfile.deleteMany();
    await prisma.companyTrainerProfile.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.passwordResetCode.deleteMany();
    await prisma.session.deleteMany();
    await prisma.userStatus.deleteMany();
    await prisma.userActivityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.user.deleteMany();
    await prisma.universityAuditLog.deleteMany();
    await prisma.companyAuditLog.deleteMany();
    await prisma.university.deleteMany();
    await prisma.company.deleteMany();

    console.log("  ✅ Cleanup done");
}

// -------------------------------------
// MAIN
// -------------------------------------
async function main() {
    await cleanup();
    console.log("🌱 Seeding small dataset started...");
    const defaultHashed = await argon2.hash("S3cure@Tadreeby2026");

    // ---------- UNIVERSITIES (Gaza only) ----------
    console.log("📚 Creating universities...");
    const universitiesData = [
        { name: "Islamic University of Gaza", shortCode: "IUG" },
        { name: "Al-Azhar University", shortCode: "AZU" },
    ];

    const createdUniversities: any[] = [];
    for (const uni of universitiesData) {
        const university = await prisma.university.create({
            data: {
                name: uni.name,
                shortCode: uni.shortCode.toLowerCase(),
                email: `admin.${uni.shortCode.toLowerCase()}@tadreeby.com`,
                isActive: true,
                phone: null,
                location: null,
                description: null,
                logo: null,
            },
        });
        createdUniversities.push(university);
        await prisma.universityAuditLog.create({
            data: {
                universityId: university.id,
                action: UniversityAction.CREATED,
                performedBy: 1,
                newValue: { name: university.name, shortCode: university.shortCode },
            },
        });
        console.log(`  ✅ Created university: ${uni.name}`);
    }

    // ---------- COMPANIES ----------
    console.log("🏢 Creating companies...");
    const companiesData = [
        { name: "Tadreeby Tech", shortCode: "TAD" },
        { name: "Future Labs", shortCode: "FUT" },
    ];

    const createdCompanies: any[] = [];
    for (const comp of companiesData) {
        const company = await prisma.company.create({
            data: {
                name: comp.name,
                shortCode: comp.shortCode.toLowerCase(),
                email: `admin.${comp.shortCode.toLowerCase()}@tadreeby.com`,
                isActive: true,
                phone: null,
                location: null,
                description: null,
                logo: null,
            },
        });
        createdCompanies.push(company);
        await prisma.companyAuditLog.create({
            data: {
                companyId: company.id,
                action: CompanyAction.CREATED,
                performedBy: 1,
                newValue: { name: company.name, shortCode: company.shortCode },
            },
        });
        console.log(`  ✅ Created company: ${comp.name}`);
    }

    // ---------- SUPER ADMIN ----------
    console.log("👑 Creating Super Admin...");
    const superAdmin = await prisma.user.create({
        data: {
            firstName: "Shahd",
            lastName: "Abu Sharif",
            email: buildEmail("shahd", "sharif", "admin"),
            password: defaultHashed,
            role: UserRole.SUPER_ADMIN,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("shahd", "abusharife"),
            phone: null,
            profileImage: null,
            universityId: null,
            companyId: null,
        },
    });
    console.log("  ✅ Created Super Admin");

    await prisma.userStatus.create({
        data: {
            userId: superAdmin.id,
            status: StatusType.ONLINE,
            lastSeen: new Date(),
        },
    });

    // Update audit logs with correct performedBy
    await prisma.universityAuditLog.updateMany({
        where: { performedBy: 1 },
        data: { performedBy: superAdmin.id },
    });
    await prisma.companyAuditLog.updateMany({
        where: { performedBy: 1 },
        data: { performedBy: superAdmin.id },
    });

    // ---------- UNIVERSITY ADMIN ----------
    console.log("🎓 Creating University Admin...");
    const uniAdminUser = await prisma.user.create({
        data: {
            firstName: "Ahmad",
            lastName: "Khaled",
            email: buildEmail("ahmad", "khaled", "iug"),
            password: defaultHashed,
            role: UserRole.UNIVERSITY_ADMIN,
            universityId: createdUniversities[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("ahmad", "khaled"),
            phone: null,
            profileImage: null,
            companyId: null,
        },
    });
    await prisma.userStatus.create({
        data: {
            userId: uniAdminUser.id,
            status: StatusType.OFFLINE,
            lastSeen: new Date(),
        },
    });
    console.log(`  ✅ Created University Admin for ${createdUniversities[0].name}`);

    // ---------- UNIVERSITY SUPERVISOR #1 (IUG) ----------
    console.log("👨‍🏫 Creating University Supervisor #1 (IUG)...");
    const supervisorUser = await prisma.user.create({
        data: {
            firstName: "Nadine",
            lastName: "Saleh",
            email: buildEmail("nadine", "saleh", "iug"),
            password: defaultHashed,
            role: UserRole.UNIVERSITY_SUPERVISOR,
            universityId: createdUniversities[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("nadine", "saleh"),
            phone: null,
            profileImage: null,
            companyId: null,
            supervisorProfile: {
                create: {
                    universityId: createdUniversities[0].id,
                    department: "Computer Science",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: {
            userId: supervisorUser.id,
            status: StatusType.OFFLINE,
            lastSeen: new Date(),
        },
    });
    console.log(`  ✅ Created University Supervisor for ${createdUniversities[0].name}`);

    // ---------- UNIVERSITY SUPERVISOR #2 (AZU) ----------
    console.log("👩‍🏫 Creating University Supervisor #2 (AZU)...");
    const supervisorUser2 = await prisma.user.create({
        data: {
            firstName: "Rana",
            lastName: "Odeh",
            email: buildEmail("rana", "odeh", "azu"),
            password: defaultHashed,
            role: UserRole.UNIVERSITY_SUPERVISOR,
            universityId: createdUniversities[1].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("rana", "odeh"),
            phone: null,
            profileImage: null,
            companyId: null,
            supervisorProfile: {
                create: {
                    universityId: createdUniversities[1].id,
                    department: "Software Engineering",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: {
            userId: supervisorUser2.id,
            status: StatusType.OFFLINE,
            lastSeen: new Date(),
        },
    });
    console.log(`  ✅ Created University Supervisor for ${createdUniversities[1].name}`);

    // ---------- COMPANY ADMIN ----------
    console.log("💼 Creating Company Admin...");
    const companyAdminUser = await prisma.user.create({
        data: {
            firstName: "Khalil",
            lastName: "Nasser",
            email: buildEmail("khalil", "nasser", "tad"),
            password: defaultHashed,
            role: UserRole.COMPANY_ADMIN,
            companyId: createdCompanies[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("khalil", "nasser"),
            phone: null,
            profileImage: null,
            universityId: null,
        },
    });
    await prisma.userStatus.create({
        data: {
            userId: companyAdminUser.id,
            status: StatusType.OFFLINE,
            lastSeen: new Date(),
        },
    });
    console.log(`  ✅ Created Company Admin for ${createdCompanies[0].name}`);

    // ---------- COMPANY TRAINER #1 ----------
    console.log("🧑‍💼 Creating Company Trainer #1...");
    const trainerUser = await prisma.user.create({
        data: {
            firstName: "Hani",
            lastName: "Abu Salem",
            email: buildEmail("hani", "abusalem", "tad"),
            password: defaultHashed,
            role: UserRole.COMPANY_TRAINER,
            companyId: createdCompanies[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("hani", "abusalem"),
            phone: null,
            profileImage: null,
            universityId: null,
            trainerProfile: {
                create: {
                    companyId: createdCompanies[0].id,
                    position: "Senior Trainer",
                    specialization: "Full Stack",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: {
            userId: trainerUser.id,
            status: StatusType.ONLINE,
            lastSeen: new Date(),
        },
    });
    console.log(`  ✅ Created Company Trainer for ${createdCompanies[0].name}`);

    // ---------- STUDENTS ----------
    console.log("👨‍🎓 Creating students (approved x2 from different universities, rejected, pending)...");

    // 1) Approved student #1 (IUG)
    const approvedStudent = await prisma.user.create({
        data: {
            firstName: "Approved",
            lastName: "Student",
            email: "approved.student@student.com",
            password: defaultHashed,
            role: UserRole.STUDENT,
            universityId: createdUniversities[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("approved", "student"),
            phone: null,
            profileImage: null,
            companyId: null,
            studentProfile: {
                create: {
                    universityId: createdUniversities[0].id,
                    studentNumber: 20260001,
                    major: "Computer Science",
                    academicYear: 3,
                    gpa: 3.2,
                    approvalStatus: StudentApprovalStatus.APPROVED,
                    approvedAt: new Date(),
                    rejectionReason: null,
                    skills: "JavaScript, React, Node.js",
                    cvUrl: null,
                    verificationDocument: "verified.pdf",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: {
            userId: approvedStudent.id,
            status: StatusType.ONLINE,
            lastSeen: new Date(),
        },
    });

    // 2) Approved student #2 (AZU) - to demonstrate multi-university internship
    const approvedStudent2 = await prisma.user.create({
        data: {
            firstName: "ApprovedTwo",
            lastName: "Student",
            email: "approved.two.student@student.com",
            password: defaultHashed,
            role: UserRole.STUDENT,
            universityId: createdUniversities[1].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("approvedtwo", "student"),
            phone: null,
            profileImage: null,
            companyId: null,
            studentProfile: {
                create: {
                    universityId: createdUniversities[1].id,
                    studentNumber: 20260004,
                    major: "Software Engineering",
                    academicYear: 4,
                    gpa: 3.5,
                    approvalStatus: StudentApprovalStatus.APPROVED,
                    approvedAt: new Date(),
                    rejectionReason: null,
                    skills: "TypeScript, NestJS, PostgreSQL",
                    cvUrl: null,
                    verificationDocument: "verified2.pdf",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: {
            userId: approvedStudent2.id,
            status: StatusType.ONLINE,
            lastSeen: new Date(),
        },
    });

    // 3) Rejected student
    const rejectedStudent = await prisma.user.create({
        data: {
            firstName: "Rejected",
            lastName: "Student",
            email: "rejected.student@student.com",
            password: defaultHashed,
            role: UserRole.STUDENT,
            universityId: createdUniversities[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("rejected", "student"),
            phone: null,
            profileImage: null,
            companyId: null,
            studentProfile: {
                create: {
                    universityId: createdUniversities[0].id,
                    studentNumber: 20260002,
                    major: "Computer Science",
                    academicYear: 2,
                    gpa: 2.8,
                    approvalStatus: StudentApprovalStatus.REJECTED,
                    approvedAt: null,
                    rejectionReason: "Invalid verification document",
                    skills: null,
                    cvUrl: null,
                    verificationDocument: "invalid.pdf",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: {
            userId: rejectedStudent.id,
            status: StatusType.OFFLINE,
            lastSeen: new Date(),
        },
    });

    // 4) Pending student
    const pendingStudent = await prisma.user.create({
        data: {
            firstName: "Pending",
            lastName: "Student",
            email: "pending.student@student.com",
            password: defaultHashed,
            role: UserRole.STUDENT,
            universityId: createdUniversities[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("pending", "student"),
            phone: null,
            profileImage: null,
            companyId: null,
            studentProfile: {
                create: {
                    universityId: createdUniversities[0].id,
                    studentNumber: 20260003,
                    major: "Software Engineering",
                    academicYear: 1,
                    gpa: 3.0,
                    approvalStatus: StudentApprovalStatus.PENDING,
                    approvedAt: null,
                    rejectionReason: null,
                    skills: null,
                    cvUrl: null,
                    verificationDocument: "pending.pdf",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: {
            userId: pendingStudent.id,
            status: StatusType.OFFLINE,
            lastSeen: new Date(),
        },
    });

    console.log("  ✅ Created 4 students (2 approved from different universities, 1 rejected, 1 pending)");

    // ---------- SUPERVISOR-STUDENT ASSIGNMENTS ----------
    // After a student is APPROVED, they must be assigned to a supervisor
    // from their own university (regardless of any internship).
    console.log("🔗 Assigning approved students to their university supervisors...");

    // Approved student #1 (IUG) -> Supervisor #1 (IUG)
    await prisma.supervisorStudent.create({
        data: {
            supervisorId: supervisorUser.id,
            studentId: approvedStudent.id,
            assignedAt: new Date(),
            notes: "Assigned after approval from IUG.",
        },
    });

    // Approved student #2 (AZU) -> Supervisor #2 (AZU)
    await prisma.supervisorStudent.create({
        data: {
            supervisorId: supervisorUser2.id,
            studentId: approvedStudent2.id,
            assignedAt: new Date(),
            notes: "Assigned after approval from AZU.",
        },
    });

    console.log("  ✅ Assigned 2 approved students to their supervisors");

    // ---------- TRAINING OPPORTUNITIES (5) ----------
    console.log("📋 Creating 5 Training Opportunities...");
    const opportunityTitles = [
        "Frontend Developer Intern",
        "Backend Engineer Intern",
        "Full Stack Developer Intern",
        "Data Science Intern",
        "DevOps Engineer Intern",
    ];
    const skillSets = [
        "React,TypeScript,Tailwind",
        "Node.js,Express,MongoDB",
        "React,Node.js,PostgreSQL",
        "Python,Pandas,Scikit-learn",
        "Docker,Kubernetes,AWS",
    ];
    const types: TrainingType[] = ["HYBRID", "ONSITE", "REMOTE", "HYBRID", "ONSITE"];

    const createdOpportunities: any[] = [];
    for (let i = 0; i < 5; i++) {
        const company = createdCompanies[i % createdCompanies.length];
        const opp = await prisma.trainingOpportunity.create({
            data: {
                companyId: company.id,
                title: opportunityTitles[i],
                description: `Internship program for ${opportunityTitles[i]} at ${company.name}.`,
                requiredSkills: skillSets[i],
                duration: `${(i % 3) + 3} months`,
                totalSeats: 10 + i * 2,
                isActive: true,
                type: types[i],
                location: null,
                meetingLink: null,
            },
        });
        createdOpportunities.push(opp);
        console.log(`  ✅ Created: ${opportunityTitles[i]}`);
    }

    // ---------- INTERNSHIP ----------
    // NOTE: no universityId, no supervisorId anymore.
    // It belongs to a company and an opportunity, and can host many students
    // from different universities. Trainers/supervisors are derived via students.
    console.log("📝 Creating Internship (with trainer, multiple universities via students)...");
    const selectedOpportunity = createdOpportunities[0]; // Frontend Developer Intern
    const internship = await prisma.internship.create({
        data: {
            opportunityId: selectedOpportunity.id,
            companyId: selectedOpportunity.companyId,
            trainerId: trainerUser.id, // every internship must have a trainer
            status: InternshipStatus.ACTIVE,
        },
    });
    console.log(`  ✅ Created Internship #${internship.id} for "${selectedOpportunity.title}"`);

    // ---------- INTERNSHIP STUDENTS ----------
    // Both approved students (from different universities) join the SAME internship.
    console.log("📊 Assigning approved students (from IUG & AZU) to the same internship...");

    await prisma.internshipStudent.create({
        data: {
            internshipId: internship.id,
            studentId: approvedStudent.id, // IUG
            createdAt: new Date(),
        },
    });

    await prisma.internshipStudent.create({
        data: {
            internshipId: internship.id,
            studentId: approvedStudent2.id, // AZU
            createdAt: new Date(),
        },
    });

    console.log(`  ✅ Assigned 2 students from different universities to Internship #${internship.id}`);

    // ---------- ATTENDANCE ----------
    console.log("📅 Creating attendance records for approved student #1...");
    const today = new Date();
    for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        await prisma.attendance.create({
            data: {
                internshipId: internship.id,
                studentId: approvedStudent.id,
                date: date,
                status: AttendanceStatus.CHECKED_IN,
                checkOut: new Date(date.getTime() + 8 * 60 * 60 * 1000),
                duration: "8 hours",
            },
        });
    }
    console.log("  ✅ Created 3 attendance records");

    // ---------- TASKS ----------
    console.log("📋 Creating tasks for the internship...");
    const tasksData = [
        { title: "Set up development environment", status: TaskStatus.DONE },
        { title: "Create React components for dashboard", status: TaskStatus.IN_PROGRESS },
        { title: "Implement API integration", status: TaskStatus.TODO },
    ];

    const createdTasks: any[] = [];
    for (const t of tasksData) {
        const task = await prisma.task.create({
            data: {
                internshipId: internship.id,
                title: t.title,
                description: `Task: ${t.title}`,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: t.status,
            },
        });
        createdTasks.push(task);
        console.log(`  ✅ Created task: ${t.title} (${t.status})`);
    }

    // ---------- TASK SUBMISSION (for the "DONE" task) ----------
    const doneTask = createdTasks.find(t => t.status === TaskStatus.DONE);
    if (doneTask) {
        console.log("📤 Creating task submission for approved student #1...");
        await prisma.taskSubmission.create({
            data: {
                taskId: doneTask.id,
                studentId: approvedStudent.id,
                fileUrl: "https://example.com/submission.zip",
                score: 85,
                feedback: "Good work, but needs more comments.",
                submittedAt: new Date(),
            },
        });
        console.log("  ✅ Created task submission");
    }

    // ---------- EVALUATION (from trainer) ----------
    console.log("⭐ Creating evaluation from trainer for approved student #1...");
    await prisma.evaluation.create({
        data: {
            internshipId: internship.id,
            studentId: approvedStudent.id,
            evaluatorId: trainerUser.id,
            type: EvaluationType.TRAINER,
            score: 88,
            feedback: "Excellent performance so far.",
            createdAt: new Date(),
        },
    });
    console.log("  ✅ Created evaluation");

    // ---------- FINAL SUMMARY ----------
    console.log("\n✅ Small seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`  - ${createdUniversities.length} Universities (Gaza only)`);
    console.log(`  - ${createdCompanies.length} Companies`);
    console.log(`  - 1 Super Admin`);
    console.log(`  - 1 University Admin`);
    console.log(`  - 2 University Supervisors (1 per university)`);
    console.log(`  - 1 Company Admin`);
    console.log(`  - 1 Company Trainer`);
    console.log(`  - 4 Students (2 approved from IUG & AZU, 1 rejected, 1 pending)`);
    console.log(`  - 2 SupervisorStudent assignments (approved students only)`);
    console.log(`  - ${createdOpportunities.length} Training Opportunities`);
    console.log(`  - 1 Internship (with trainer, hosting 2 students from different universities)`);
    console.log(`  - 3 Attendance records`);
    console.log(`  - ${createdTasks.length} Tasks`);
    console.log(`  - 1 Task Submission`);
    console.log(`  - 1 Evaluation`);
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
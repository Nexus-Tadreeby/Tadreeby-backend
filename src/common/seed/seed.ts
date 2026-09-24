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
    UserRole,
    AttendanceStatus,
    TaskStatus,
    TaskBadge,
    EvaluationType,
    OpportunityStatus,
} from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// -------------------------------------
// HELPERS
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
// CLEANUP
// -------------------------------------
async function cleanup() {
    console.log("🧹 Cleaning up existing data...");

    await prisma.aIEvaluation.deleteMany();
    await prisma.taskSubmission.deleteMany();
    await prisma.task.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.internshipStudent.deleteMany();
    await prisma.internshipSupervisor.deleteMany();
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

    // ---------- UNIVERSITIES ----------
    console.log("📚 Creating universities...");
    const universitiesData = [
        {
            name: "Islamic University of Gaza",
            shortCode: "IUG",
            phone: "+970-8-282-3310",
            location: "Al-Nasser Street, Gaza City, Palestine",
            description: "One of the leading universities in the Gaza Strip, specializing in science, engineering, and humanities.",
        },
        {
            name: "Al-Azhar University",
            shortCode: "AZU",
            phone: "+970-8-264-1044",
            location: "Jamal Abdel Nasser Street, Gaza City, Palestine",
            description: "A historic Palestinian university offering a wide range of academic programs in Gaza.",
        },
    ];

    const createdUniversities: any[] = [];
    for (const uni of universitiesData) {
        const university = await prisma.university.create({
            data: {
                name: uni.name,
                shortCode: uni.shortCode.toLowerCase(),
                email: `admin.${uni.shortCode.toLowerCase()}@tadreeby.com`,
                isActive: true,
                phone: uni.phone,
                location: uni.location,
                description: uni.description,
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
        {
            name: "Tadreeby Tech",
            shortCode: "TAD",
            phone: "+970-59-123-4567",
            location: "Omar Al-Mukhtar Street, Gaza City, Palestine",
            description: "A software house focused on building scalable web and mobile applications for clients in MENA.",
            internsTrained: 140,
            completionRate: 94,
            universityPartners: 5,
            avgStudentRating: 4.7,
            verifiedByTadreeby: true,
        },
        {
            name: "Future Labs",
            shortCode: "FUT",
            phone: "+970-59-987-6543",
            location: "Al-Rimal District, Gaza City, Palestine",
            description: "An innovation lab working on data science and AI-driven products for the region.",
            internsTrained: 45,
            completionRate: 88,
            universityPartners: 2,
            avgStudentRating: 4.3,
            verifiedByTadreeby: false,
        },
    ];

    const createdCompanies: any[] = [];
    for (const comp of companiesData) {
        const company = await prisma.company.create({
            data: {
                name: comp.name,
                shortCode: comp.shortCode.toLowerCase(),
                email: `admin.${comp.shortCode.toLowerCase()}@tadreeby.com`,
                isActive: true,
                phone: comp.phone,
                location: comp.location,
                description: comp.description,
                logo: null,
                internsTrained: comp.internsTrained,
                completionRate: comp.completionRate,
                universityPartners: comp.universityPartners,
                avgStudentRating: comp.avgStudentRating,
                verifiedByTadreeby: comp.verifiedByTadreeby,
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
            phone: "+970-59-100-0001",
            universityId: null,
            companyId: null,
        },
    });
    await prisma.userStatus.create({
        data: { userId: superAdmin.id, status: StatusType.ONLINE, lastSeen: new Date() },
    });
    console.log("  ✅ Created Super Admin");

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
            firstName: "University",
            lastName: "Admin",
            email: buildEmail("university", "admin", "iug"),
            password: defaultHashed,
            role: UserRole.UNIVERSITY_ADMIN,
            universityId: createdUniversities[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("university", "admin"),
            phone: "+970-59-100-0002",
            companyId: null,
        },
    });
    await prisma.userStatus.create({
        data: { userId: uniAdminUser.id, status: StatusType.OFFLINE, lastSeen: new Date() },
    });
    console.log(`  ✅ Created University Admin for ${createdUniversities[0].name}`);

    // ---------- UNIVERSITY SUPERVISOR #1 (IUG) ----------
    console.log("👨‍🏫 Creating University Supervisor #1 (IUG)...");
    const supervisorUser = await prisma.user.create({
        data: {
            firstName: "University",
            lastName: "Supervisor1",
            email: buildEmail("university", "supervisor1", "iug"),
            password: defaultHashed,
            role: UserRole.UNIVERSITY_SUPERVISOR,
            universityId: createdUniversities[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("university", "supervisor1"),
            phone: "+970-59-100-0003",
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
        data: { userId: supervisorUser.id, status: StatusType.OFFLINE, lastSeen: new Date() },
    });
    console.log(`  ✅ Created University Supervisor for ${createdUniversities[0].name}`);

    // ---------- UNIVERSITY SUPERVISOR #2 (AZU) ----------
    console.log("👩‍🏫 Creating University Supervisor #2 (AZU)...");
    const supervisorUser2 = await prisma.user.create({
        data: {
            firstName: "University",
            lastName: "Supervisor2",
            email: buildEmail("university", "supervisor2", "azu"),
            password: defaultHashed,
            role: UserRole.UNIVERSITY_SUPERVISOR,
            universityId: createdUniversities[1].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("university", "supervisor2"),
            phone: "+970-59-100-0004",
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
        data: { userId: supervisorUser2.id, status: StatusType.OFFLINE, lastSeen: new Date() },
    });
    console.log(`  ✅ Created University Supervisor for ${createdUniversities[1].name}`);

    // ---------- COMPANY ADMIN ----------
    console.log("💼 Creating Company Admin...");
    const companyAdminUser = await prisma.user.create({
        data: {
            firstName: "Company",
            lastName: "Admin",
            email: buildEmail("company", "admin", "tad"),
            password: defaultHashed,
            role: UserRole.COMPANY_ADMIN,
            companyId: createdCompanies[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("company", "admin"),
            phone: "+970-59-100-0005",
            universityId: null,
        },
    });
    await prisma.userStatus.create({
        data: { userId: companyAdminUser.id, status: StatusType.OFFLINE, lastSeen: new Date() },
    });
    console.log(`  ✅ Created Company Admin for ${createdCompanies[0].name}`);

    // ---------- COMPANY TRAINER #1 ----------
    console.log("🧑‍💼 Creating Company Trainer #1...");
    const trainerUser = await prisma.user.create({
        data: {
            firstName: "Company",
            lastName: "Trainer",
            email: buildEmail("company", "trainer", "tad"),
            password: defaultHashed,
            role: UserRole.COMPANY_TRAINER,
            companyId: createdCompanies[0].id,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("company", "trainer"),
            phone: "+970-59-100-0006",
            universityId: null,
            trainerProfile: {
                create: {
                    companyId: createdCompanies[0].id,
                    position: "Senior Trainer",
                    specialization: "Full Stack",
                    bio: "Ex-AWS Community Hero • 8+ yrs DevOps",
                    yearsExperience: 8,
                    achievements: [
                        "AWS Community Hero",
                        "CKA (Certified Kubernetes Administrator)",
                    ],
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: { userId: trainerUser.id, status: StatusType.ONLINE, lastSeen: new Date() },
    });
    console.log(`  ✅ Created Company Trainer for ${createdCompanies[0].name}`);

    // ---------- STUDENTS ----------
    console.log("👨‍🎓 Creating students...");

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
            phone: "+970-59-200-0001",
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
                    skills: "Ruby, Rails, PostgreSQL, RSpec, Docker",
                    cvUrl: "https://docs.google.com/document/d/1TtGZ8mJFs77N_CKyq4IcClZB9G9LEQNo57s9pJJodx4/edit?tab=t.0",
                    verificationDocument: "verified.pdf",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: { userId: approvedStudent.id, status: StatusType.ONLINE, lastSeen: new Date() },
    });

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
            phone: "+970-59-200-0002",
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
                    skills: "TypeScript, NestJS, PostgreSQL",
                    cvUrl: "https://docs.google.com/document/d/1TtGZ8mJFs77N_CKyq4IcClZB9G9LEQNo57s9pJJodx4/edit?tab=t.0",
                    verificationDocument: "verified2.pdf",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: { userId: approvedStudent2.id, status: StatusType.ONLINE, lastSeen: new Date() },
    });

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
            phone: "+970-59-200-0003",
            companyId: null,
            studentProfile: {
                create: {
                    universityId: createdUniversities[0].id,
                    studentNumber: 20260002,
                    major: "Computer Science",
                    academicYear: 2,
                    gpa: 2.8,
                    approvalStatus: StudentApprovalStatus.REJECTED,
                    rejectionReason: "Invalid verification document",
                    skills: "HTML, CSS, basic JavaScript",
                    verificationDocument: "invalid.pdf",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: { userId: rejectedStudent.id, status: StatusType.OFFLINE, lastSeen: new Date() },
    });

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
            phone: "+970-59-200-0004",
            companyId: null,
            studentProfile: {
                create: {
                    universityId: createdUniversities[0].id,
                    studentNumber: 20260003,
                    major: "Software Engineering",
                    academicYear: 1,
                    gpa: 3.0,
                    approvalStatus: StudentApprovalStatus.PENDING,
                    skills: "Python, basic algorithms",
                    verificationDocument: "pending.pdf",
                },
            },
        },
    });
    await prisma.userStatus.create({
        data: { userId: pendingStudent.id, status: StatusType.OFFLINE, lastSeen: new Date() },
    });

    console.log("  ✅ Created 4 students");

    // ---------- SUPERVISOR-STUDENT ASSIGNMENTS ----------
    console.log("🔗 Assigning approved students to their university supervisors...");

    await prisma.supervisorStudent.create({
        data: { supervisorId: supervisorUser.id, studentId: approvedStudent.id, notes: "Assigned after approval from IUG." },
    });
    await prisma.supervisorStudent.create({
        data: { supervisorId: supervisorUser2.id, studentId: approvedStudent2.id, notes: "Assigned after approval from AZU." },
    });
    console.log("  ✅ Assigned 2 approved students to their supervisors");

    // ---------- TRAINING OPPORTUNITIES (5) ----------
    console.log("📋 Creating 5 Training Opportunities...");
    const opportunityTitles = [
        "Backend Engineer Intern",
        "Frontend Developer Intern",
        "Full Stack Developer Intern",
        "Data Science Intern",
        "DevOps Engineer Intern",
    ];
    const skillSets = [
        "Ruby,Rails,PostgreSQL,REST APIs,JWT,RSpec",
        "React,TypeScript,Tailwind",
        "React,Node.js,PostgreSQL",
        "Python,Pandas,Scikit-learn",
        "Docker,Kubernetes,AWS",
    ];
    const types: TrainingType[] = ["HYBRID", "HYBRID", "REMOTE", "HYBRID", "ONSITE"];
    const oppLocations = [
        "Tadreeby Tech HQ, Gaza",
        "Tadreeby Tech HQ, Gaza",
        "Remote / Online",
        "Future Labs HQ, Gaza",
        "Future Labs HQ, Gaza",
    ];
    const oppMeetingLinks = [
        "https://meet.tadreeby.com/backend-intern",
        "https://meet.tadreeby.com/frontend-intern",
        "https://meet.tadreeby.com/fullstack-intern",
        "https://meet.tadreeby.com/data-intern",
        "https://meet.tadreeby.com/devops-intern",
    ];

    const createdOpportunities: any[] = [];
    for (let i = 0; i < 5; i++) {
        const company = createdCompanies[i % createdCompanies.length];
        const isBackend = i === 0;

        const opp = await prisma.trainingOpportunity.create({
            data: {
                companyId: company.id,
                trainerId: isBackend ? trainerUser.id : null,
                title: opportunityTitles[i],
                description: `Internship program for ${opportunityTitles[i]} at ${company.name}.`,
                requiredSkills: skillSets[i],
                duration: `${(i % 3) + 3} months`,
                totalSeats: 10 + i * 2,
                isActive: true,
                status: isBackend ? OpportunityStatus.CLOSED : OpportunityStatus.OPEN,
                type: types[i],
                location: oppLocations[i],
                meetingLink: oppMeetingLinks[i],
                stipend: 0,
                daysPerWeek: 3,
                trainingField: opportunityTitles[i].replace(" Intern", ""),
                workDays: "Sunday - Tuesday - Thursday",
                workHours: "09:00 - 15:00",
                cohort: "Cohort Fall 2026",
                coverImage: "https://media.istockphoto.com/vectors/accounting-financial-analysis-tax-payment-analytics-data-capture-vector-id1399038180?k=20&m=1399038180&s=612x612&w=0&h=fhPTNk7AtOPPehbkiEcbpnEfmnDSIytZnJmJ66krQcg=",
                hoursTotal: 200,
                hoursPerWeek: 20,
                dailyHours: 6,
                workStartTime: "09:00",
                workEndTime: "15:00",
                attendanceMinPercent: 90,
                checkInStart: "08:45",
                checkInEnd: "09:15",
                venueName: "Tadreeby Tech HQ",
                venueAddress: "Omar Al-Mukhtar Street, Gaza",
                venueEquipment: "Dual-monitor workstations, high-speed fiber backbone, and gigabit LAN.",
                remoteTools: "Discord, GitHub",
                latitude: 31.501,
                longitude: 34.466,
                certificateInfo: {
                    name: "Verified Certificate of Mastery",
                    signedBy: company.name,
                    verifiable: true,
                    verifiableOn: ["LinkedIn", "Tadreeby Registry"],
                },
                ...(isBackend && {
                    applicationDeadline: new Date("2026-07-10T23:59:00Z"),
                    publishedAt: new Date("2026-06-01T10:00:00Z"),
                    closedAt: new Date("2026-07-11T00:00:00Z"),
                    startDate: new Date("2026-07-14T09:00:00Z"),
                    endDate: new Date("2026-09-30T15:00:00Z"),
                    hoursTotal: 360,
                    hoursPerWeek: 30,
                    daysPerWeek: 5,
                    cohort: "Cohort 2026-A",
                    duration: "3 Months",
                    totalSeats: 50,
                    location: "Gaza Tech Hub",
                    trainingField: "Backend Engineering",
                    workDays: "Sunday - Thursday",
                    techStack: [
                        "Ruby 3.2",
                        "Rails 7.1",
                        "PostgreSQL 16",
                        "REST APIs & JWT",
                        "RSpec & TDD",
                        "Docker Compose",
                        "Redis & Sidekiq",
                        "Git & GitHub Actions",
                    ],
                    learningObjectives: [
                        { title: "Master MVC Architecture & ActiveRecord Schemas", description: "Design complex normalized relational schemas, custom database migrations, associations, eager-loading optimizations, and query indexes." },
                        { title: "Secure RESTful Endpoints & Tokenized Authentication", description: "Implement Devise-JWT authentication, granular role permissions with Pundit, API rate limiting, and defensive request validation." },
                        { title: "Test-Driven Development (TDD) with RSpec & CI Pipelines", description: "Write deterministic unit, request, and integration test suites using FactoryBot and VCR, with automated PR regression checks via GitHub Actions." },
                        { title: "Asynchronous Queues & Background Workers", description: "Implement high-throughput async processing via Sidekiq and Redis for transactional emails, report exports, and webhook dispatches." },
                    ],
                    competencies: [
                        "RESTful JSON API Standards & Versioning",
                        "Relational Schema Normalization & Indexing",
                        "Background Jobs & Redis Cache Stores",
                        "CI/CD Automated GitHub Action Deployments",
                    ],
                    curriculum: [
                        { phase: "PHASE 01", weeks: "WEEKS 1 – 3", title: "Ruby Fundamentals & Object-Oriented Programming", description: "Deep dive into Ruby syntax, blocks, procs, lambdas, modules, mixins, and the object model.", tags: ["Ruby 3.2", "IRB", "Bundler"] },
                        { phase: "PHASE 02", weeks: "WEEKS 4 – 7", title: "Rails 7.1 MVC Architecture & ActiveRecord", description: "Master Rails conventions, routing, controllers, views, and the full MVC flow.", tags: ["Rails 7.1", "ActiveRecord", "PostgreSQL 16"] },
                        { phase: "PHASE 03", weeks: "WEEKS 8 – 12", title: "RESTful APIs, JWT Authentication & TDD", description: "Design scalable REST APIs with JWT authentication, Pundit authorization, and rate limiting.", tags: ["REST APIs", "JWT", "RSpec & TDD"] },
                        { phase: "PHASE 04", weeks: "WEEKS 13 – 16", title: "Background Jobs, Docker & Production Deployment", description: "Implement Sidekiq background workers with Redis, containerize the app with Docker Compose, and deploy to production with GitHub Actions CI/CD pipelines.", tags: ["Sidekiq", "Docker Compose", "GitHub Actions"] },
                    ],
                    responsibilities: [
                        { order: 1, title: "Build RESTful API Endpoints", description: "Design and implement production-grade REST APIs with proper versioning, error handling, and request validation." },
                        { order: 2, title: "Write Comprehensive RSpec Test Suites", description: "Maintain deterministic unit, request, and integration tests with high coverage using FactoryBot and VCR." },
                        { order: 3, title: "Daily Agile Standups & PR Reviews", description: "Participate in 15-minute morning standups, review peer code, and track ticket velocity on GitHub Projects." },
                        { order: 4, title: "Database Schema Design & Optimization", description: "Design normalized PostgreSQL schemas, write migrations, and optimize queries with proper indexes and eager loading." },
                    ],
                    qualifications: {
                        academic: [
                            "Enrolled 3rd or 4th-year student in Computer Science, Software Engineering, or Computer Engineering.",
                            "Minimum cumulative GPA of 75% or equivalent academic performance.",
                        ],
                        technical: [
                            "Solid understanding of Object-Oriented Programming (any language).",
                            "Basic familiarity with relational databases and SQL.",
                            "Comfortable with Git version control (branching, pull requests, merge conflicts).",
                        ],
                    },
                }),
            },
        });
        createdOpportunities.push(opp);
        console.log(`  ✅ Created: ${opportunityTitles[i]}`);
    }

    // ---------- INTERNSHIP (based on Backend Opportunity) ----------
    console.log("📝 Creating Internship...");
    const selectedOpportunity = createdOpportunities[0];

    const internship = await prisma.internship.create({
        data: {
            opportunityId: selectedOpportunity.id,
            companyId: selectedOpportunity.companyId,
            trainerId: trainerUser.id,
            status: InternshipStatus.ACTIVE,
            cohort: "Cohort 2026-A",
            startDate: new Date("2026-07-14T09:00:00Z"),
            endDate: new Date("2026-09-30T15:00:00Z"),
            enrolledCount: 2,
            progressPercent: 67,
            currentMilestone: 4,
            totalMilestones: 6,
            weeksTotal: 12,
            weeksCompleted: 8,
        },
    });
    console.log(`  ✅ Created Internship #${internship.id}`);

    // ---------- INTERNSHIP SUPERVISORS ----------
    await prisma.internshipSupervisor.create({
        data: {
            internshipId: internship.id,
            supervisorId: supervisorUser.id,
            universityId: createdUniversities[0].id,
            role: "Islamic University Coordinator",
        },
    });
    await prisma.internshipSupervisor.create({
        data: {
            internshipId: internship.id,
            supervisorId: supervisorUser2.id,
            universityId: createdUniversities[1].id,
            role: "Al-Azhar University Coordinator",
        },
    });
    console.log("  ✅ Assigned 2 university supervisors to the internship");

    // ---------- INTERNSHIP STUDENTS ----------
    await prisma.internshipStudent.create({
        data: { internshipId: internship.id, studentId: approvedStudent.id, attendanceRate: 98, status: "Optimal" },
    });
    await prisma.internshipStudent.create({
        data: { internshipId: internship.id, studentId: approvedStudent2.id, attendanceRate: 92, status: "Optimal" },
    });
    console.log(`  ✅ Assigned 2 students to Internship #${internship.id}`);

    // ---------- ATTENDANCE ----------
    console.log("📅 Creating attendance records...");
    const attendancePattern = [
        { hours: 8, minutes: 50, note: "On-site QR verification" },
        { hours: 9, minutes: 30, note: "Late check-in" },
        { hours: 8, minutes: 45, note: "On-site QR verification" },
        { hours: 9, minutes: 20, note: "Late check-in" },
        { hours: 8, minutes: 55, note: "On-site QR verification" },
        { hours: 9, minutes: 10, note: "Late check-in" },
    ];

    const today = new Date();
    for (let i = 0; i < attendancePattern.length; i++) {
        const pattern = attendancePattern[i];
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const checkIn = new Date(date);
        checkIn.setHours(pattern.hours, pattern.minutes, 0, 0);

        const checkOut = new Date(date);
        checkOut.setHours(15, 0, 0, 0);

        await prisma.attendance.create({
            data: {
                internshipId: internship.id,
                studentId: approvedStudent.id,
                date,
                checkIn,
                checkOut,
                duration: "6 hours",
                status: AttendanceStatus.CHECKED_IN,
                location: "CodeCraft Studio Lab 3",
                notes: pattern.note,
            },
        });
    }
    console.log(`  ✅ Created ${attendancePattern.length} attendance records`);

    // ---------- TASKS ----------
    console.log("📋 Creating tasks for the internship...");
    const tasksData = [
        {
            title: "Authentication & JWT Refresh Architecture",
            status: TaskStatus.IN_PROGRESS,
            badge: TaskBadge.IN_REVIEW,
            deadline: new Date("2026-08-28T23:59:00Z"),
            rubricUrl: "https://docs.google.com/document/d/1TtGZ8mJFs77N_CKyq4IcClZB9G9LEQNo57s9pJJodx4/edit?tab=t.0",
            rubric: [
                { title: "Code Quality & Standards", weight: 30 },
                { title: "Core Functionality & Logic", weight: 40 },
                { title: "Documentation & Schema", weight: 30 },
                { title: "Git Workflow & Testing", weight: 10 },
            ],
        },
        {
            title: "Set up development environment",
            status: TaskStatus.DONE,
            badge: TaskBadge.GRADED,
            deadline: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            rubricUrl: null,
        },
        {
            title: "Build RSpec test suite for user endpoints",
            status: TaskStatus.DONE,
            badge: TaskBadge.GRADED,
            deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            rubricUrl: null,
        },
        {
            title: "Implement Redis caching layer",
            status: TaskStatus.DONE,
            badge: TaskBadge.GRADED,
            deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            rubricUrl: null,
        },
        {
            title: "Create React components for dashboard",
            status: TaskStatus.IN_PROGRESS,
            badge: TaskBadge.ACTIVE,
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            rubricUrl: null,
        },
        {
            title: "Implement API integration",
            status: TaskStatus.TODO,
            badge: null,
            deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            rubricUrl: null,
        },
    ];

    const createdTasks: any[] = [];
    for (const t of tasksData) {
        const task = await prisma.task.create({
            data: {
                internshipId: internship.id,
                title: t.title,
                description: `Task: ${t.title}`,
                deadline: t.deadline,
                status: t.status,
                badge: t.badge,
                rubricUrl: t.rubricUrl,
                rubric: t.rubric,
            },
        });
        createdTasks.push(task);
        console.log(`  ✅ Created task: ${t.title}`);
    }

    // ---------- TASK SUBMISSIONS + AI EVALUATIONS ----------
    console.log("📤 Creating submissions + AI evaluations...");
    const doneTasks = createdTasks.filter((t) => t.status === TaskStatus.DONE);
    const submissionScores = [
        { score: 85, feedback: "Good work, but needs more comments." },
        { score: 92, feedback: "Excellent test coverage." },
        { score: 88, feedback: "Clean implementation, minor refactoring needed." },
    ];

    for (let i = 0; i < doneTasks.length; i++) {
        const task = doneTasks[i];
        const sub = submissionScores[i % submissionScores.length];

        const submission = await prisma.taskSubmission.create({
            data: {
                taskId: task.id,
                studentId: approvedStudent.id,
                fileUrl: "https://docs.google.com/document/d/1TtGZ8mJFs77N_CKyq4IcClZB9G9LEQNo57s9pJJodx4/edit?tab=t.0",
                score: sub.score,
                feedback: sub.feedback,
                submittedAt: new Date(task.deadline!.getTime() + 2 * 24 * 60 * 60 * 1000),
            },
        });

        await prisma.aIEvaluation.create({
            data: {
                taskSubmissionId: submission.id,
                score: 93.5,
                analysis: "Approved Student consistently adheres to clean architecture principles and test-driven patterns. Recommended focus for upcoming sprint: Deepen Redis cache eviction strategies and Sidekiq error retry policies.",
                recommendations: "Consider implementing rate limiting with Rack::Attack and adding more edge-case tests.",
            },
        });

        console.log(`  ✅ Created submission + AI eval for: ${task.title}`);
    }

    // ---------- EVALUATION ----------
    console.log("⭐ Creating evaluation from trainer...");
    await prisma.evaluation.create({
        data: {
            internshipId: internship.id,
            studentId: approvedStudent.id,
            evaluatorId: trainerUser.id,
            type: EvaluationType.TRAINER,
            score: 92,
            feedback: "Approved Student demonstrates exceptional grasp of advanced associations and test suites. Keep up the high standard on the upcoming microservices decoupling.",
            breakdown: [
                { name: "Code Quality & Clean Architecture", score: 94 },
                { name: "Punctuality & Daily Standup", score: 96 },
                { name: "Problem Solving & Debugging", score: 88 },
                { name: "Agile Collaboration & Git Hygiene", score: 90 },
            ],
            createdAt: new Date(),
        },
    });
    console.log("  ✅ Created evaluation");

    // ---------- FINAL SUMMARY ----------
    console.log("\n✅ Small seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`  - ${createdUniversities.length} Universities`);
    console.log(`  - ${createdCompanies.length} Companies`);
    console.log(`  - 1 Super Admin`);
    console.log(`  - 1 University Admin`);
    console.log(`  - 2 University Supervisors`);
    console.log(`  - 1 Company Admin`);
    console.log(`  - 1 Company Trainer`);
    console.log(`  - 4 Students`);
    console.log(`  - ${createdOpportunities.length} Training Opportunities`);
    console.log(`  - 1 Internship (with 2 supervisors + 2 students)`);
    console.log(`  - 2 InternshipSupervisor assignments`);
    console.log(`  - 2 InternshipStudent assignments`);
    console.log(`  - ${attendancePattern.length} Attendance records`);
    console.log(`  - ${createdTasks.length} Tasks`);
    console.log(`  - ${doneTasks.length} Submissions + AI Evaluations`);
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



// import "dotenv/config";

// import {
//     CompanyAction,
//     InternshipStatus,
//     PrismaClient,
//     StatusType,
//     StudentApprovalStatus,
//     TrainingType,
//     UniversityAction,
//     UserRole,
//     AttendanceStatus,
//     TaskStatus,
//     TaskBadge,
//     EvaluationType,
// } from "@prisma/client";
// import * as argon2 from "argon2";
// import { PrismaPg } from "@prisma/adapter-pg";

// const adapter = new PrismaPg({
//     connectionString: process.env.DATABASE_URL!,
// });

// const prisma = new PrismaClient({ adapter });

// // -------------------------------------
// // HELPERS (minimal)
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

// // -------------------------------------
// // CLEANUP (idempotent seed)
// // -------------------------------------
// async function cleanup() {
//     console.log("🧹 Cleaning up existing data...");

//     // Order matters: children before parents
//     await prisma.aIEvaluation.deleteMany();
//     await prisma.taskSubmission.deleteMany();
//     await prisma.task.deleteMany();
//     await prisma.attendance.deleteMany();
//     await prisma.evaluation.deleteMany();
//     await prisma.internshipStudent.deleteMany();
//     await prisma.internshipSupervisor.deleteMany(); // ← NEW
//     await prisma.internship.deleteMany();
//     await prisma.application.deleteMany();
//     await prisma.trainingOpportunity.deleteMany();
//     await prisma.supervisorStudent.deleteMany();
//     await prisma.universitySupervisorProfile.deleteMany();
//     await prisma.companyTrainerProfile.deleteMany();
//     await prisma.studentProfile.deleteMany();
//     await prisma.passwordResetCode.deleteMany();
//     await prisma.session.deleteMany();
//     await prisma.userStatus.deleteMany();
//     await prisma.userActivityLog.deleteMany();
//     await prisma.notification.deleteMany();
//     await prisma.message.deleteMany();
//     await prisma.user.deleteMany();
//     await prisma.universityAuditLog.deleteMany();
//     await prisma.companyAuditLog.deleteMany();
//     await prisma.university.deleteMany();
//     await prisma.company.deleteMany();

//     console.log("  ✅ Cleanup done");
// }

// // -------------------------------------
// // MAIN
// // -------------------------------------
// async function main() {
//     await cleanup();
//     console.log("🌱 Seeding small dataset started...");
//     const defaultHashed = await argon2.hash("S3cure@Tadreeby2026");

//     // ---------- UNIVERSITIES (Gaza only) ----------
//     console.log("📚 Creating universities...");
//     const universitiesData = [
//         {
//             name: "Islamic University of Gaza",
//             shortCode: "IUG",
//             phone: "+970-8-282-3310",
//             location: "Al-Nasser Street, Gaza City, Palestine",
//             description:
//                 "One of the leading universities in the Gaza Strip, specializing in science, engineering, and humanities.",
//         },
//         {
//             name: "Al-Azhar University",
//             shortCode: "AZU",
//             phone: "+970-8-264-1044",
//             location: "Jamal Abdel Nasser Street, Gaza City, Palestine",
//             description:
//                 "A historic Palestinian university offering a wide range of academic programs in Gaza.",
//         },
//     ];

//     const createdUniversities: any[] = [];
//     for (const uni of universitiesData) {
//         const university = await prisma.university.create({
//             data: {
//                 name: uni.name,
//                 shortCode: uni.shortCode.toLowerCase(),
//                 email: `admin.${uni.shortCode.toLowerCase()}@tadreeby.com`,
//                 isActive: true,
//                 phone: uni.phone,
//                 location: uni.location,
//                 description: uni.description,
//                 logo: null,
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

//     // ---------- COMPANIES ----------
//     console.log("🏢 Creating companies...");
//     const companiesData = [
//         {
//             name: "Tadreeby Tech",
//             shortCode: "TAD",
//             phone: "+970-59-123-4567",
//             location: "Omar Al-Mukhtar Street, Gaza City, Palestine",
//             description:
//                 "A software house focused on building scalable web and mobile applications for clients in MENA.",
//         },
//         {
//             name: "Future Labs",
//             shortCode: "FUT",
//             phone: "+970-59-987-6543",
//             location: "Al-Rimal District, Gaza City, Palestine",
//             description:
//                 "An innovation lab working on data science and AI-driven products for the region.",
//         },
//     ];

//     const createdCompanies: any[] = [];
//     for (const comp of companiesData) {
//         const company = await prisma.company.create({
//             data: {
//                 name: comp.name,
//                 shortCode: comp.shortCode.toLowerCase(),
//                 email: `admin.${comp.shortCode.toLowerCase()}@tadreeby.com`,
//                 isActive: true,
//                 phone: comp.phone,
//                 location: comp.location,
//                 description: comp.description,
//                 logo: null,
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

//     // ---------- SUPER ADMIN ----------
//     console.log("👑 Creating Super Admin...");
//     const superAdmin = await prisma.user.create({
//         data: {
//             firstName: "Shahd",
//             lastName: "Abu Sharif",
//             email: buildEmail("shahd", "sharif", "admin"),
//             password: defaultHashed,
//             role: UserRole.SUPER_ADMIN,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("shahd", "abusharife"),
//             phone: "+970-59-100-0001",
//             universityId: null,
//             companyId: null,
//         },
//     });
//     console.log("  ✅ Created Super Admin");

//     await prisma.userStatus.create({
//         data: {
//             userId: superAdmin.id,
//             status: StatusType.ONLINE,
//             lastSeen: new Date(),
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

//     // ---------- UNIVERSITY ADMIN ----------
//     console.log("🎓 Creating University Admin...");
//     const uniAdminUser = await prisma.user.create({
//         data: {
//             firstName: "University",
//             lastName: "Admin",
//             email: buildEmail("university", "admin", "iug"),
//             password: defaultHashed,
//             role: UserRole.UNIVERSITY_ADMIN,
//             universityId: createdUniversities[0].id,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("university", "admin"),
//             phone: "+970-59-100-0002",
//             companyId: null,
//         },
//     });
//     await prisma.userStatus.create({
//         data: {
//             userId: uniAdminUser.id,
//             status: StatusType.OFFLINE,
//             lastSeen: new Date(),
//         },
//     });
//     console.log(`  ✅ Created University Admin for ${createdUniversities[0].name}`);

//     // ---------- UNIVERSITY SUPERVISOR #1 (IUG) ----------
//     console.log("👨‍🏫 Creating University Supervisor #1 (IUG)...");
//     const supervisorUser = await prisma.user.create({
//         data: {
//             firstName: "University",
//             lastName: "Supervisor1",
//             email: buildEmail("university", "supervisor1", "iug"),
//             password: defaultHashed,
//             role: UserRole.UNIVERSITY_SUPERVISOR,
//             universityId: createdUniversities[0].id,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("university", "supervisor1"),
//             phone: "+970-59-100-0003",
//             companyId: null,
//             supervisorProfile: {
//                 create: {
//                     universityId: createdUniversities[0].id,
//                     department: "Computer Science",
//                 },
//             },
//         },
//     });
//     await prisma.userStatus.create({
//         data: {
//             userId: supervisorUser.id,
//             status: StatusType.OFFLINE,
//             lastSeen: new Date(),
//         },
//     });
//     console.log(`  ✅ Created University Supervisor for ${createdUniversities[0].name}`);

//     // ---------- UNIVERSITY SUPERVISOR #2 (AZU) ----------
//     console.log("👩‍🏫 Creating University Supervisor #2 (AZU)...");
//     const supervisorUser2 = await prisma.user.create({
//         data: {
//             firstName: "University",
//             lastName: "Supervisor2",
//             email: buildEmail("university", "supervisor2", "azu"),
//             password: defaultHashed,
//             role: UserRole.UNIVERSITY_SUPERVISOR,
//             universityId: createdUniversities[1].id,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("university", "supervisor2"),
//             phone: "+970-59-100-0004",
//             companyId: null,
//             supervisorProfile: {
//                 create: {
//                     universityId: createdUniversities[1].id,
//                     department: "Software Engineering",
//                 },
//             },
//         },
//     });
//     await prisma.userStatus.create({
//         data: {
//             userId: supervisorUser2.id,
//             status: StatusType.OFFLINE,
//             lastSeen: new Date(),
//         },
//     });
//     console.log(`  ✅ Created University Supervisor for ${createdUniversities[1].name}`);

//     // ---------- COMPANY ADMIN ----------
//     console.log("💼 Creating Company Admin...");
//     const companyAdminUser = await prisma.user.create({
//         data: {
//             firstName: "Company",
//             lastName: "Admin",
//             email: buildEmail("company", "admin", "tad"),
//             password: defaultHashed,
//             role: UserRole.COMPANY_ADMIN,
//             companyId: createdCompanies[0].id,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("company", "admin"),
//             phone: "+970-59-100-0005",
//             universityId: null,
//         },
//     });
//     await prisma.userStatus.create({
//         data: {
//             userId: companyAdminUser.id,
//             status: StatusType.OFFLINE,
//             lastSeen: new Date(),
//         },
//     });
//     console.log(`  ✅ Created Company Admin for ${createdCompanies[0].name}`);

//     // ---------- COMPANY TRAINER #1 ----------
//     console.log("🧑‍💼 Creating Company Trainer #1...");
//     const trainerUser = await prisma.user.create({
//         data: {
//             firstName: "Company",
//             lastName: "Trainer",
//             email: buildEmail("company", "trainer", "tad"),
//             password: defaultHashed,
//             role: UserRole.COMPANY_TRAINER,
//             companyId: createdCompanies[0].id,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("company", "trainer"),
//             phone: "+970-59-100-0006",
//             universityId: null,
//             trainerProfile: {
//                 create: {
//                     companyId: createdCompanies[0].id,
//                     position: "Senior Trainer",
//                     specialization: "Full Stack",
//                 },
//             },
//         },
//     });
//     await prisma.userStatus.create({
//         data: {
//             userId: trainerUser.id,
//             status: StatusType.ONLINE,
//             lastSeen: new Date(),
//         },
//     });
//     console.log(`  ✅ Created Company Trainer for ${createdCompanies[0].name}`);

//     // ---------- STUDENTS ----------
//     console.log("👨‍🎓 Creating students (approved x2 from different universities, rejected, pending)...");

//     // 1) Approved student #1 (IUG)
//     const approvedStudent = await prisma.user.create({
//         data: {
//             firstName: "Approved",
//             lastName: "Student",
//             email: "approved.student@student.com",
//             password: defaultHashed,
//             role: UserRole.STUDENT,
//             universityId: createdUniversities[0].id,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("ahmad", "najjar"),
//             phone: "+970-59-200-0001",
//             companyId: null,
//             studentProfile: {
//                 create: {
//                     universityId: createdUniversities[0].id,
//                     studentNumber: 20260001,
//                     major: "Computer Science",
//                     academicYear: 3,
//                     gpa: 3.2,
//                     approvalStatus: StudentApprovalStatus.APPROVED,
//                     approvedAt: new Date(),
//                     rejectionReason: null,
//                     skills: "JavaScript, React, Node.js",
//                     cvUrl: "https://docs.google.com/document/d/1TtGZ8mJFs77N_CKyq4IcClZB9G9LEQNo57s9pJJodx4/edit?tab=t.0",
//                     verificationDocument: "verified.pdf",
//                 },
//             },
//         },
//     });
//     await prisma.userStatus.create({
//         data: {
//             userId: approvedStudent.id,
//             status: StatusType.ONLINE,
//             lastSeen: new Date(),
//         },
//     });

//     // 2) Approved student #2 (AZU)
//     const approvedStudent2 = await prisma.user.create({
//         data: {
//             firstName: "ApprovedTwo",
//             lastName: "Student",
//             email: "approved.two.student@student.com",
//             password: defaultHashed,
//             role: UserRole.STUDENT,
//             universityId: createdUniversities[1].id,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("approvedtwo", "student"),
//             phone: "+970-59-200-0002",
//             companyId: null,
//             studentProfile: {
//                 create: {
//                     universityId: createdUniversities[1].id,
//                     studentNumber: 20260004,
//                     major: "Software Engineering",
//                     academicYear: 4,
//                     gpa: 3.5,
//                     approvalStatus: StudentApprovalStatus.APPROVED,
//                     approvedAt: new Date(),
//                     rejectionReason: null,
//                     skills: "TypeScript, NestJS, PostgreSQL",
//                     cvUrl: "https://docs.google.com/document/d/1TtGZ8mJFs77N_CKyq4IcClZB9G9LEQNo57s9pJJodx4/edit?tab=t.0",
//                     verificationDocument: "verified2.pdf",
//                 },
//             },
//         },
//     });
//     await prisma.userStatus.create({
//         data: {
//             userId: approvedStudent2.id,
//             status: StatusType.ONLINE,
//             lastSeen: new Date(),
//         },
//     });

//     // 3) Rejected student
//     const rejectedStudent = await prisma.user.create({
//         data: {
//             firstName: "Rejected",
//             lastName: "Student",
//             email: "rejected.student@student.com",
//             password: defaultHashed,
//             role: UserRole.STUDENT,
//             universityId: createdUniversities[0].id,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("rejected", "student"),
//             phone: "+970-59-200-0003",
//             companyId: null,
//             studentProfile: {
//                 create: {
//                     universityId: createdUniversities[0].id,
//                     studentNumber: 20260002,
//                     major: "Computer Science",
//                     academicYear: 2,
//                     gpa: 2.8,
//                     approvalStatus: StudentApprovalStatus.REJECTED,
//                     approvedAt: null,
//                     rejectionReason: "Invalid verification document",
//                     skills: "HTML, CSS, basic JavaScript",
//                     cvUrl: "https://docs.google.com/document/d/1TtGZ8mJFs77N_CKyq4IcClZB9G9LEQNo57s9pJJodx4/edit?tab=t.0",
//                     verificationDocument: "invalid.pdf",
//                 },
//             },
//         },
//     });
//     await prisma.userStatus.create({
//         data: {
//             userId: rejectedStudent.id,
//             status: StatusType.OFFLINE,
//             lastSeen: new Date(),
//         },
//     });

//     // 4) Pending student
//     const pendingStudent = await prisma.user.create({
//         data: {
//             firstName: "Pending",
//             lastName: "Student",
//             email: "pending.student@student.com",
//             password: defaultHashed,
//             role: UserRole.STUDENT,
//             universityId: createdUniversities[0].id,
//             personalID: generatePersonalId(),
//             isActive: true,
//             recoveryEmail: buildRecoveryEmail("pending", "student"),
//             phone: "+970-59-200-0004",
//             companyId: null,
//             studentProfile: {
//                 create: {
//                     universityId: createdUniversities[0].id,
//                     studentNumber: 20260003,
//                     major: "Software Engineering",
//                     academicYear: 1,
//                     gpa: 3.0,
//                     approvalStatus: StudentApprovalStatus.PENDING,
//                     approvedAt: null,
//                     rejectionReason: "Under review by university admin",
//                     skills: "Python, basic algorithms",
//                     cvUrl: "https://docs.google.com/document/d/1TtGZ8mJFs77N_CKyq4IcClZB9G9LEQNo57s9pJJodx4/edit?tab=t.0",
//                     verificationDocument: "pending.pdf",
//                 },
//             },
//         },
//     });
//     await prisma.userStatus.create({
//         data: {
//             userId: pendingStudent.id,
//             status: StatusType.OFFLINE,
//             lastSeen: new Date(),
//         },
//     });

//     console.log("  ✅ Created 4 students (2 approved from different universities, 1 rejected, 1 pending)");

//     // ---------- SUPERVISOR-STUDENT ASSIGNMENTS ----------
//     console.log("🔗 Assigning approved students to their university supervisors...");

//     await prisma.supervisorStudent.create({
//         data: {
//             supervisorId: supervisorUser.id,
//             studentId: approvedStudent.id,
//             assignedAt: new Date(),
//             notes: "Assigned after approval from IUG.",
//         },
//     });

//     await prisma.supervisorStudent.create({
//         data: {
//             supervisorId: supervisorUser2.id,
//             studentId: approvedStudent2.id,
//             assignedAt: new Date(),
//             notes: "Assigned after approval from AZU.",
//         },
//     });

//     console.log("  ✅ Assigned 2 approved students to their supervisors");

//     // ---------- TRAINING OPPORTUNITIES (5) ----------
//     console.log("📋 Creating 5 Training Opportunities...");
//     const opportunityTitles = [
//         "Frontend Developer Intern",
//         "Backend Engineer Intern",
//         "Full Stack Developer Intern",
//         "Data Science Intern",
//         "DevOps Engineer Intern",
//     ];
//     const skillSets = [
//         "React,TypeScript,Tailwind",
//         "Node.js,Express,MongoDB",
//         "React,Node.js,PostgreSQL",
//         "Python,Pandas,Scikit-learn",
//         "Docker,Kubernetes,AWS",
//     ];
//     const types: TrainingType[] = ["HYBRID", "ONSITE", "REMOTE", "HYBRID", "ONSITE"];
//     const oppLocations = [
//         "Tadreeby Tech HQ, Gaza",
//         "Tadreeby Tech HQ, Gaza",
//         "Remote / Online",
//         "Future Labs HQ, Gaza",
//         "Future Labs HQ, Gaza",
//     ];
//     const oppMeetingLinks = [
//         "https://meet.tadreeby.com/frontend-intern",
//         "https://meet.tadreeby.com/backend-intern",
//         "https://meet.tadreeby.com/fullstack-intern",
//         "https://meet.tadreeby.com/data-intern",
//         "https://meet.tadreeby.com/devops-intern",
//     ];

//     const createdOpportunities: any[] = [];
//     for (let i = 0; i < 5; i++) {
//         const company = createdCompanies[i % createdCompanies.length];
//         const opp = await prisma.trainingOpportunity.create({
//             data: {
//                 companyId: company.id,
//                 title: opportunityTitles[i],
//                 description: `Internship program for ${opportunityTitles[i]} at ${company.name}.`,
//                 requiredSkills: skillSets[i],
//                 duration: `${(i % 3) + 3} months`,
//                 totalSeats: 10 + i * 2,
//                 isActive: true,
//                 type: types[i],
//                 location: oppLocations[i],
//                 meetingLink: oppMeetingLinks[i],
//             },
//         });
//         createdOpportunities.push(opp);
//         console.log(`  ✅ Created: ${opportunityTitles[i]}`);
//     }

//     // ---------- INTERNSHIP (FULL DETAILS) ----------
//     console.log("📝 Creating Internship with full details...");
//     const selectedOpportunity = createdOpportunities[0]; // Frontend Developer Intern

//     const internshipStart = new Date("2026-07-14T09:00:00Z");
//     const internshipEnd = new Date("2026-09-30T15:00:00Z");

//     const internship = await prisma.internship.create({
//         data: {
//             opportunityId: selectedOpportunity.id,
//             companyId: selectedOpportunity.companyId,
//             trainerId: trainerUser.id,
//             status: InternshipStatus.ACTIVE,

//             // Display
//             title: "Backend Engineering: Rails & Microservices",
//             subtitle:
//                 "Track your trainer's training progress, grading rubrics, attendance rosters, and curriculum execution.",
//             description:
//                 "Practical, production-grade intensive training focused on modern backend systems engineering and web APIs using Ruby on Rails 7.1. Trainees architect and deploy scalable micro-services, complex relational data schemas with PostgreSQL, secure authentication tokens, distributed background queues, and automated test pipelines adhering to strict enterprise agile standards.",
//             coverImage:
//                 "https://media.istockphoto.com/vectors/accounting-financial-analysis-tax-payment-analytics-data-capture-vector-id1399038180?k=20&m=1399038180&s=612x612&w=0&h=fhPTNk7AtOPPehbkiEcbpnEfmnDSIytZnJmJ66krQcg=",
//             cohort: "Cohort 2026-A",
//             trainingType: TrainingType.HYBRID,
//             location: "Gaza Tech Hub",

//             // Progress
//             progressPercent: 67,
//             currentSprint: 4,
//             totalSprints: 6,
//             weeksTotal: 12,
//             weeksCompleted: 8,
//             hoursTotal: 360,
//             hoursPerWeek: 30,

//             // Schedule
//             startDate: internshipStart,
//             endDate: internshipEnd,
//             workingDays: "Sunday - Thursday",
//             dailyHours: 6,
//             workStartTime: "09:00",
//             workEndTime: "15:00",

//             // Attendance
//             attendanceMinPercent: 90,
//             checkInStart: "08:45",
//             checkInEnd: "09:15",

//             // Venue
//             venueName: "CodeCraft Studio Lab 3",
//             venueAddress: "4th Floor, IT Complex Tower, Gaza",
//             venueEquipment:
//                 "Dual-monitor workstations, high-speed fiber backbone, and gigabit LAN.",
//             remoteTools: "Discord, GitHub",
//             latitude: 31.501,
//             longitude: 34.466,

//             // Capacity
//             maxStudents: 50,
//             enrolledCount: 50,

//             // Complex JSON
//             techStack: [
//                 "Ruby 3.2",
//                 "Rails 7.1",
//                 "PostgreSQL 16",
//                 "REST APIs & JWT",
//                 "RSpec & TDD",
//                 "Docker Compose",
//                 "Redis & Sidekiq",
//                 "Git & GitHub Actions",
//             ],
//             learningObjectives: [
//                 {
//                     title: "Master MVC Architecture & ActiveRecord Schemas",
//                     description:
//                         "Design complex normalized relational schemas, custom database migrations, associations, eager-loading optimizations, and query indexes.",
//                 },
//                 {
//                     title: "Secure RESTful Endpoints & Tokenized Authentication",
//                     description:
//                         "Implement Devise-JWT authentication, granular role permissions with Pundit, API rate limiting, and defensive request validation.",
//                 },
//                 {
//                     title: "Test-Driven Development (TDD) with RSpec & CI Pipelines",
//                     description:
//                         "Write deterministic unit, request, and integration test suites using FactoryBot and VCR, with automated PR regression checks via GitHub Actions.",
//                 },
//                 {
//                     title: "Asynchronous Queues & Background Workers",
//                     description:
//                         "Implement high-throughput async processing via Sidekiq and Redis for transactional emails, report exports, and webhook dispatches.",
//                 },
//             ],
//             competencies: [
//                 "RESTful JSON API Standards & Versioning",
//                 "Relational Schema Normalization & Indexing",
//                 "Background Jobs & Redis Cache Stores",
//                 "CI/CD Automated GitHub Action Deployments",
//             ],
//         },
//     });
//     console.log(`  ✅ Created Internship #${internship.id} - "${internship.title}"`);

//     // ---------- INTERNSHIP SUPERVISORS ----------
//     console.log("🎓 Assigning university supervisors to the internship...");

//     await prisma.internshipSupervisor.create({
//         data: {
//             internshipId: internship.id,
//             supervisorId: supervisorUser.id, // IUG supervisor
//             universityId: createdUniversities[0].id,
//             role: "Islamic University Coordinator",
//         },
//     });

//     await prisma.internshipSupervisor.create({
//         data: {
//             internshipId: internship.id,
//             supervisorId: supervisorUser2.id, // AZU supervisor
//             universityId: createdUniversities[1].id,
//             role: "Al-Azhar University Coordinator",
//         },
//     });

//     console.log("  ✅ Assigned 2 university supervisors to the internship");

//     // ---------- INTERNSHIP STUDENTS ----------
//     console.log("📊 Assigning approved students to the internship...");

//     await prisma.internshipStudent.create({
//         data: {
//             internshipId: internship.id,
//             studentId: approvedStudent.id, // IUG
//             attendanceRate: 98,
//             status: "Optimal",
//         },
//     });

//     await prisma.internshipStudent.create({
//         data: {
//             internshipId: internship.id,
//             studentId: approvedStudent2.id, // AZU
//             attendanceRate: 92,
//             status: "Optimal",
//         },
//     });

//     console.log(`  ✅ Assigned 2 students to Internship #${internship.id}`);

//     // ---------- ATTENDANCE ----------
//     console.log("📅 Creating attendance records for approved student #1...");
//     const today = new Date();
//     for (let i = 0; i < 3; i++) {
//         const date = new Date(today);
//         date.setDate(date.getDate() - i);

//         const checkIn = new Date(date);
//         checkIn.setHours(8, 50, 0, 0);

//         const checkOut = new Date(date);
//         checkOut.setHours(15, 0, 0, 0);

//         await prisma.attendance.create({
//             data: {
//                 internshipId: internship.id,
//                 studentId: approvedStudent.id,
//                 date: date,
//                 checkIn: checkIn,
//                 checkOut: checkOut,
//                 duration: "6 hours",
//                 status: AttendanceStatus.CHECKED_IN,
//                 location: "CodeCraft Studio Lab 3",
//                 notes: "On-site QR verification",
//             },
//         });
//     }
//     console.log("  ✅ Created 3 attendance records");

//     // ---------- TASKS ----------
//     console.log("📋 Creating tasks for the internship...");
//     const tasksData = [
//         {
//             title: "Authentication & JWT Refresh Architecture",
//             status: TaskStatus.IN_PROGRESS,
//             badge: TaskBadge.IN_REVIEW,
//             deadline: new Date("2026-08-28T23:59:00Z"),
//             rubricUrl: "https://docs.google.com/document/d/1TtGZ8mJFs77N_CKyq4IcClZB9G9LEQNo57s9pJJodx4/edit?tab=t.0",
//             rubric: [
//                 { title: "Code Quality & Standards", weight: 30 },
//                 { title: "Core Functionality & Logic", weight: 40 },
//                 { title: "Documentation & Schema", weight: 30 },
//                 { title: "Git Workflow & Testing", weight: 10 },
//             ],
//         },
//         {
//             title: "Set up development environment",
//             status: TaskStatus.DONE,
//             badge: TaskBadge.GRADED,
//             deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//             rubricUrl: null,
//         },
//         {
//             title: "Create React components for dashboard",
//             status: TaskStatus.IN_PROGRESS,
//             badge: TaskBadge.ACTIVE,
//             deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
//             rubricUrl: null,
//         },
//         {
//             title: "Implement API integration",
//             status: TaskStatus.TODO,
//             badge: null,
//             deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
//             rubricUrl: null,
//         },
//     ];

//     const createdTasks: any[] = [];
//     for (const t of tasksData) {
//         const task = await prisma.task.create({
//             data: {
//                 internshipId: internship.id,
//                 title: t.title,
//                 description: `Task: ${t.title}`,
//                 deadline: t.deadline,
//                 status: t.status,
//                 badge: t.badge,
//                 rubricUrl: t.rubricUrl,
//                 rubric: t.rubric,
//             },
//         });
//         createdTasks.push(task);
//         console.log(`  ✅ Created task: ${t.title} (${t.status})`);
//     }

//     // ---------- TASK SUBMISSION (for the "DONE" task) ----------
//     const doneTask = createdTasks.find((t) => t.status === TaskStatus.DONE);
//     if (doneTask) {
//         console.log("📤 Creating task submission for approved student #1...");
//         await prisma.taskSubmission.create({
//             data: {
//                 taskId: doneTask.id,
//                 studentId: approvedStudent.id,
//                 fileUrl: "https://docs.google.com/document/d/1TtGZ8mJFs77N_CKyq4IcClZB9G9LEQNo57s9pJJodx4/edit?tab=t.0",
//                 score: 85,
//                 feedback: "Good work, but needs more comments.",
//                 submittedAt: new Date(),
//             },
//         });
//         console.log("  ✅ Created task submission");
//     }

//     // ---------- EVALUATION (from trainer) ----------
//     console.log("⭐ Creating evaluation from trainer for approved student #1...");
//     await prisma.evaluation.create({
//         data: {
//             internshipId: internship.id,
//             studentId: approvedStudent.id,
//             evaluatorId: trainerUser.id,
//             type: EvaluationType.TRAINER,
//             score: 88,
//             feedback: "Excellent performance so far.",
//             breakdown: [
//                 { title: "Code Quality", score: 94 },
//                 { title: "Punctuality", score: 96 },
//                 { title: "Problem Solving", score: 88 },
//                 { title: "Agile Collaboration", score: 90 },
//             ],
//             createdAt: new Date(),
//         },
//     });
//     console.log("  ✅ Created evaluation");

//     // ---------- FINAL SUMMARY ----------
//     console.log("\n✅ Small seeding completed successfully!");
//     console.log("📊 Summary:");
//     console.log(`  - ${createdUniversities.length} Universities (Gaza only)`);
//     console.log(`  - ${createdCompanies.length} Companies`);
//     console.log(`  - 1 Super Admin`);
//     console.log(`  - 1 University Admin`);
//     console.log(`  - 2 University Supervisors (1 per university)`);
//     console.log(`  - 1 Company Admin`);
//     console.log(`  - 1 Company Trainer`);
//     console.log(`  - 4 Students (2 approved from IUG & AZU, 1 rejected, 1 pending)`);
//     console.log(`  - 2 SupervisorStudent assignments`);
//     console.log(`  - ${createdOpportunities.length} Training Opportunities`);
//     console.log(`  - 1 Internship (full details, with 2 supervisors + 2 students)`);
//     console.log(`  - 2 InternshipSupervisor assignments`);
//     console.log(`  - 2 InternshipStudent assignments`);
//     console.log(`  - 3 Attendance records`);
//     console.log(`  - ${createdTasks.length} Tasks`);
//     console.log(`  - 1 Task Submission`);
//     console.log(`  - 1 Evaluation`);
// }

// main()
//     .catch((e) => {
//         console.error("❌ Seeding failed:", e);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });
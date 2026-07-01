import "dotenv/config";

import { CompanyAction, PrismaClient, StatusType, StudentApprovalStatus, UniversityAction, UserAction, UserRole } from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});
// -------------------------------------
// PERSONAL ID GENERATOR
// -------------------------------------
let personalIdCounter = 100000000;

function generatePersonalId() {
    return personalIdCounter++;
}

// -------------------------------------
// RECOVERY EMAIL GENERATOR
// -------------------------------------
let recoveryEmailCounter = 0;

function buildRecoveryEmail(firstName: string, lastName: string): string {
    const base = `${firstName.toLowerCase().replace(/\s+/g, '')}${lastName.toLowerCase().replace(/\s+/g, '')}`;
    return `${base}${recoveryEmailCounter++}@gmail.com`;
}

// -------------------------------------
// DATA
// -------------------------------------

const universities = [
    { name: "Al-Azhar University", shortCode: "AZU" },
    { name: "Palestine University", shortCode: "PLU" },
    { name: "Al-Aqsa University", shortCode: "AQU" },
];

const companies = [
    { name: "Tadreeby Tech", shortCode: "TAD" },
    { name: "Future Labs", shortCode: "FUT" },
];

// -------------------------------------
// HELPERS
// -------------------------------------

function buildEmail(first: string, last: string, code: string) {
    return `${first.toLowerCase().replace(/\s+/g, "")}.${last
        .toLowerCase()
        .replace(/\s+/g, "")}.${code.toLowerCase()}@tadreeby.com`;
}

// -------------------------------------
// MAIN
// -------------------------------------

async function main() {
    console.log("🌱 Seeding started...");

    const defaultHashed = await argon2.hash("S3cure@Tadreeby2026");

    // -------------------------------------
    // UNIVERSITIES
    // -------------------------------------

    console.log("📚 Creating universities...");
    const createdUniversities: any[] = [];

    for (const uni of universities) {
        const university = await prisma.university.create({
            data: {
                name: uni.name,
                shortCode: uni.shortCode.toLowerCase(),
                email: `admin.${uni.shortCode.toLowerCase()}@tadreeby.com`,
                isActive: true,
            },
        });

        createdUniversities.push(university);
        console.log(`  ✅ Created university: ${uni.name}`);

        // ✅ Create audit log for university creation
        await prisma.universityAuditLog.create({
            data: {
                universityId: university.id,
                action: UniversityAction.CREATED,
                performedBy: 1, // Super Admin (will be created later, update after)
                newValue: { name: university.name, shortCode: university.shortCode },
            },
        });
    }

    // -------------------------------------
    // COMPANIES
    // -------------------------------------

    console.log("🏢 Creating companies...");
    const createdCompanies: any[] = [];

    for (const comp of companies) {
        const company = await prisma.company.create({
            data: {
                name: comp.name,
                shortCode: comp.shortCode.toLowerCase(),
                email: `admin.${comp.shortCode.toLowerCase()}@tadreeby.com`,
                isActive: true,
            },
        });

        createdCompanies.push(company);
        console.log(`  ✅ Created company: ${comp.name}`);

        // ✅ Create audit log for company creation
        await prisma.companyAuditLog.create({
            data: {
                companyId: company.id,
                action: CompanyAction.CREATED,
                performedBy: 1, // Super Admin
                newValue: { name: company.name, shortCode: company.shortCode },
            },
        });
    }

    // -------------------------------------
    // SUPER ADMIN
    // -------------------------------------

    console.log("👑 Creating Super Admin...");
    const superAdmin = await prisma.user.create({
        data: {
            firstName: "Shahd",
            lastName: "Sharif",
            email: buildEmail("shahd", "sharif", "admin"),
            password: defaultHashed,
            role: UserRole.SUPER_ADMIN,
            personalID: generatePersonalId(),
            isActive: true,
            recoveryEmail: buildRecoveryEmail("shahd", "abusharife"),
        },
    });
    console.log("  ✅ Created Super Admin");

    // ✅ Create User Status for Super Admin
    await prisma.userStatus.create({
        data: {
            userId: superAdmin.id,
            status: StatusType.OFFLINE,
            lastSeen: new Date(),
        },
    });

    // ✅ Create User Activity Log for Super Admin
    await prisma.userActivityLog.create({
        data: {
            userId: superAdmin.id,
            action: UserAction.LOGIN,
            ipAddress: "127.0.0.1",
            userAgent: "Seed Script",
            deviceInfo: "Local Seed",
        },
    });

    // ✅ Update audit logs with correct performedBy
    await prisma.universityAuditLog.updateMany({
        where: { performedBy: 1 },
        data: { performedBy: superAdmin.id },
    });

    await prisma.companyAuditLog.updateMany({
        where: { performedBy: 1 },
        data: { performedBy: superAdmin.id },
    });

    // -------------------------------------
    // UNIVERSITY ADMINS
    // -------------------------------------

    console.log("🎓 Creating University Admins...");
    const uniAdmins = [
        { first: "Ahmad", last: "Khaled" },
        { first: "Sara", last: "Mahmoud" },
        { first: "Yousef", last: "Ali" },
    ];

    for (let i = 0; i < createdUniversities.length; i++) {
        const uni = createdUniversities[i];
        const admin = uniAdmins[i];

        const user = await prisma.user.create({
            data: {
                firstName: admin.first,
                lastName: admin.last,
                email: buildEmail(admin.first, admin.last, uni.shortCode),
                password: defaultHashed,
                role: UserRole.UNIVERSITY_ADMIN,
                universityId: uni.id,
                personalID: generatePersonalId(),
                isActive: true,
                recoveryEmail: buildRecoveryEmail(admin.first, admin.last), 
            },
        });

        // ✅ Create User Status
        await prisma.userStatus.create({
            data: {
                userId: user.id,
                status: StatusType.OFFLINE,
                lastSeen: new Date(),
            },
        });

        console.log(`  ✅ Created University Admin: ${admin.first} ${admin.last} for ${uni.name}`);
    }

    // -------------------------------------
    // UNIVERSITY SUPERVISORS
    // -------------------------------------

    console.log("👨‍🏫 Creating University Supervisors...");
    const supervisors = [
        { first: "Nadine", last: "Saleh" },
        { first: "Mahmoud", last: "Faraj" },
        { first: "Lina", last: "Hussein" },
    ];

    for (let i = 0; i < createdUniversities.length; i++) {
        const uni = createdUniversities[i];
        const s = supervisors[i];

        const user = await prisma.user.create({
            data: {
                firstName: s.first,
                lastName: s.last,
                email: buildEmail(s.first, s.last, uni.shortCode),
                password: defaultHashed,
                role: UserRole.UNIVERSITY_SUPERVISOR,
                universityId: uni.id,
                personalID: generatePersonalId(),
                isActive: true,
                recoveryEmail: buildRecoveryEmail(s.first, s.last),
                supervisorProfile: {
                    create: {
                        universityId: uni.id,
                        department: "Computer Science",
                    },
                },
            },
        });

        // ✅ Create User Status
        await prisma.userStatus.create({
            data: {
                userId: user.id,
                status: StatusType.OFFLINE,
                lastSeen: new Date(),
            },
        });

        console.log(`  ✅ Created University Supervisor: ${s.first} ${s.last} for ${uni.name}`);
    }

    // -------------------------------------
    // COMPANY ADMINS
    // -------------------------------------

    console.log("💼 Creating Company Admins...");
    const companyAdmins = [
        { first: "Khalil", last: "Nasser" },
        { first: "Rana", last: "Odeh" },
    ];

    for (let i = 0; i < createdCompanies.length; i++) {
        const comp = createdCompanies[i];
        const admin = companyAdmins[i];

        const user = await prisma.user.create({
            data: {
                firstName: admin.first,
                lastName: admin.last,
                email: buildEmail(admin.first, admin.last, comp.shortCode),
                password: defaultHashed,
                role: UserRole.COMPANY_ADMIN,
                companyId: comp.id,
                personalID: generatePersonalId(),
                isActive: true,
                recoveryEmail: buildRecoveryEmail(admin.first, admin.last),
            },
        });

        // ✅ Create User Status
        await prisma.userStatus.create({
            data: {
                userId: user.id,
                status: StatusType.OFFLINE,
                lastSeen: new Date(),
            },
        });

        console.log(`  ✅ Created Company Admin: ${admin.first} ${admin.last} for ${comp.name}`);
    }

    // -------------------------------------
    // COMPANY TRAINERS
    // -------------------------------------

    console.log("🧑‍💼 Creating Company Trainers...");
    const trainers = [
        { first: "Hani", last: "Abu Salem" },
        { first: "Dalia", last: "Khoury" },
    ];

    for (let i = 0; i < createdCompanies.length; i++) {
        const comp = createdCompanies[i];
        const t = trainers[i];

        const user = await prisma.user.create({
            data: {
                firstName: t.first,
                lastName: t.last,
                email: buildEmail(t.first, t.last, comp.shortCode),
                password: defaultHashed,
                role: UserRole.COMPANY_TRAINER,
                companyId: comp.id,
                personalID: generatePersonalId(),
                isActive: true,
                recoveryEmail: buildRecoveryEmail(t.first, t.last),   
                trainerProfile: {
                    create: {
                        companyId: comp.id,
                        position: "Senior Trainer",
                        specialization: "Software Engineering",
                    },
                },
            },
        });

        // ✅ Create User Status
        await prisma.userStatus.create({
            data: {
                userId: user.id,
                status: StatusType.OFFLINE,
                lastSeen: new Date(),
            },
        });

        console.log(`  ✅ Created Company Trainer: ${t.first} ${t.last} for ${comp.name}`);
    }

    // -------------------------------------
    // STUDENTS
    // -------------------------------------

    console.log("👨‍🎓 Creating Students...");
    const studentNames = [
        { first: "Mohammad", last: "Ali" },
        { first: "Sara", last: "Abdullah" },
        { first: "Yousef", last: "Hamed" },
        { first: "Lina", last: "Omar" },
        { first: "Omar", last: "Salem" },
    ];

    const majors = [
        "Backend Developer",
        "Frontend Developer",
        "UX/UI Designer",
        "Network Engineer",
    ];

    for (let i = 0; i < 10; i++) {
        const uni = createdUniversities[i % createdUniversities.length];
        const s = studentNames[i % studentNames.length];
        const major = majors[i % majors.length];

        const email = `${s.first.toLowerCase().replace(/\s+/g, "")}.${s.last
            .toLowerCase()
            .replace(/\s+/g, "")}${i}@test.com`;
        const recoveryEmail = buildRecoveryEmail(s.first, s.last);

        const user = await prisma.user.create({
            data: {
                firstName: s.first,
                lastName: s.last,
                email,
                password: defaultHashed,
                role: UserRole.STUDENT,
                universityId: uni.id,
                personalID: generatePersonalId(),
                isActive: true,
                recoveryEmail: buildRecoveryEmail(s.first, s.last),
                studentProfile: {
                    create: {
                        universityId: uni.id,
                        studentNumber: 20260000 + i,
                        major,
                        academicYear: 3,
                        gpa: 3.0 + (i % 5) * 0.2,
                        approvalStatus: StudentApprovalStatus.APPROVED,
                        approvedAt: new Date(),
                        verificationDocument: "seed-file.pdf",
                    },
                },
            },
        });

        // ✅ Create User Status
        await prisma.userStatus.create({
            data: {
                userId: user.id,
                status: StatusType.OFFLINE,
                lastSeen: new Date(),
            },
        });

        console.log(`  ✅ Created Student: ${s.first} ${s.last} (${email})`);
    }

    console.log("✅ Seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`  - ${createdUniversities.length} Universities`);
    console.log(`  - ${createdCompanies.length} Companies`);
    console.log(`  - 1 Super Admin`);
    console.log(`  - ${uniAdmins.length} University Admins`);
    console.log(`  - ${supervisors.length} University Supervisors`);
    console.log(`  - ${companyAdmins.length} Company Admins`);
    console.log(`  - ${trainers.length} Company Trainers`);
    console.log(`  - 10 Students`);
    console.log(`  - ${await prisma.userStatus.count()} User Statuses created`);
    console.log(`  - ${await prisma.userActivityLog.count()} User Activity Logs created`);
    console.log(`  - ${await prisma.universityAuditLog.count()} University Audit Logs created`);
    console.log(`  - ${await prisma.companyAuditLog.count()} Company Audit Logs created`);
}

// -------------------------------------
// RUN
// -------------------------------------

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
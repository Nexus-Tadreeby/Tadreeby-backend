import "dotenv/config";

import { PrismaClient, UserRole } from "@prisma/client";
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
    }

    // -------------------------------------
    // COMPANIES
    // -------------------------------------

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
    }

    // -------------------------------------
    // SUPER ADMIN
    // -------------------------------------

    await prisma.user.create({
        data: {
            firstName: "Shahd",
            lastName: "sharif",
            email: buildEmail("shahd", "sharif", "admin"),
            password: defaultHashed,
            role: UserRole.SUPER_ADMIN,
            personalID: generatePersonalId(),
        },
    });

    // -------------------------------------
    // UNIVERSITY ADMINS
    // -------------------------------------

    const uniAdmins = [
        { first: "Ahmad", last: "Khaled" },
        { first: "Sara", last: "Mahmoud" },
        { first: "Yousef", last: "Ali" },
    ];

    for (let i = 0; i < createdUniversities.length; i++) {
        const uni = createdUniversities[i];
        const admin = uniAdmins[i];

        await prisma.user.create({
            data: {
                firstName: admin.first,
                lastName: admin.last,
                email: buildEmail(admin.first, admin.last, uni.shortCode),
                password: defaultHashed,
                role: UserRole.UNIVERSITY_ADMIN,
                universityId: uni.id,
                personalID: generatePersonalId(),
            },
        });
    }

    // -------------------------------------
    // UNIVERSITY SUPERVISORS
    // -------------------------------------

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
            },
        });

        await prisma.universitySupervisorProfile.create({
            data: {
                userId: user.id,
                universityId: uni.id,
                department: "Computer Science",
            },
        });
    }

    // -------------------------------------
    // COMPANY ADMINS
    // -------------------------------------

    const companyAdmins = [
        { first: "Khalil", last: "Nasser" },
        { first: "Rana", last: "Odeh" },
    ];

    for (let i = 0; i < createdCompanies.length; i++) {
        const comp = createdCompanies[i];
        const admin = companyAdmins[i];

        await prisma.user.create({
            data: {
                firstName: admin.first,
                lastName: admin.last,
                email: buildEmail(admin.first, admin.last, comp.shortCode),
                password: defaultHashed,
                role: UserRole.COMPANY_ADMIN,
                companyId: comp.id,
                personalID: generatePersonalId(),
            },
        });
    }

    // -------------------------------------
    // COMPANY TRAINERS
    // -------------------------------------

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
            },
        });

        await prisma.companyTrainerProfile.create({
            data: {
                userId: user.id,
                companyId: comp.id,
                position: "Senior Trainer",
                specialization: "Software Engineering",
            },
        });
    }

    // -------------------------------------
    // STUDENTS
    // -------------------------------------

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

        await prisma.user.create({
            data: {
                firstName: s.first,
                lastName: s.last,
                email,
                password: defaultHashed,
                role: UserRole.STUDENT,
                universityId: uni.id,
                personalID: generatePersonalId(),

                studentProfile: {
                    create: {
                        universityId: uni.id,
                        studentNumber: 20260000 + i, 
                        major,
                        academicYear: 3,
                        gpa: 3.0 + (i % 5) * 0.2,
                        approvalStatus: "APPROVED",
                        approvedAt: new Date(),
                        verificationDocument: "seed-file.pdf",
                    },
                },
            },
        });
    }

    console.log("✅ Seeding completed successfully");
}

// -------------------------------------
// RUN
// -------------------------------------

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
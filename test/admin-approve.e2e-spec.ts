import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
const request = require('supertest');
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/infrastructure/database/database.service';

describe('Admin approve flow (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
    }, 20000);

    afterAll(async () => {
        await app.close();
    });

    it('admin can approve student and receive enriched response', async () => {
        const db: DatabaseService = app.get(DatabaseService);

        const adminEmail = `uni.admin+${Date.now()}@example.com`;
        const adminPass = 'AdminPass1!';

        // create university admin in DB
        const adminPersonalId = Number(String(Date.now()).slice(-10));
        const admin = await db.user.create({
            data: {
                email: adminEmail,
                firstName: 'Uni',
                lastName: 'Admin',
                password: await argon2.hash(adminPass),
                role: 'UNIVERSITY_ADMIN',
                universityId: 1,
                isActive: true,
                personalID: adminPersonalId,
            },
        });

        // register a student via API
        const studentPayload = {
            firstName: 'Approve',
            lastName: 'Me',
            personalID: Number(String(Date.now() + 1).slice(-10)),
            studentNumber: Number(String(Date.now() + 2).slice(-6)),
            phone: '0123456789',
            email: `approve.student+${Date.now()}@example.com`,
            password: 'Password123!',
            universityId: 1,
            verificationDocument: 'http://example.com/doc.pdf',
        };

        const registerRes = await request(app.getHttpServer()).post('/auth/register/student').send(studentPayload).expect(201);
        const studentUserId = registerRes.body.user.id;

        // login as admin
        const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: adminEmail, password: adminPass }).expect(200);
        const accessToken = loginRes.body.accessToken;

        // approve the student
        const approveRes = await request(app.getHttpServer())
            .post(`/admin/students/${studentUserId}/approve`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send()
            .expect(201);

        expect(approveRes.body).toHaveProperty('user');
        expect(approveRes.body.user).toHaveProperty('studentProfile');
        expect(approveRes.body.user.studentProfile.approvalStatus).toBe('APPROVED');
        expect(approveRes.body.user).toHaveProperty('university');

    }, 20000);
});

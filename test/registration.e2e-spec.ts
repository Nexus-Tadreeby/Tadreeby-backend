import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/infrastructure/database/database.service';

describe('Registration flow (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
    }, 20000);

    afterAll(async () => {
        await app.close();
    });

    it('registers a student and creates pending profile + notification', async () => {
        const payload = {
            firstName: 'Test',
            lastName: 'Student',
            personalID: Number(String(Date.now()).slice(-10)),
            studentNumber: Number(String(Date.now()).slice(-6)),
            phone: '0123456789',
            email: `test.student+${Date.now()}@example.com`,
            password: 'Password123!',
            universityId: 1,
            verificationDocument: 'http://example.com/doc.pdf',
        };

        const registerRes = await request(app.getHttpServer()).post('/auth/register/student').send(payload).expect(201);
        expect(registerRes.body).toHaveProperty('user');
        expect(registerRes.body.user).toHaveProperty('studentProfile');
        expect(registerRes.body.user.studentProfile.approvalStatus).toBe('PENDING');

        // check notification created for the student
        const userId = registerRes.body.user.id;
        const db: DatabaseService = app.get(DatabaseService);
        const notifications = await db.notification.findMany({ where: { userId } });
        expect(notifications.length).toBeGreaterThanOrEqual(1);
    }, 20000);
});

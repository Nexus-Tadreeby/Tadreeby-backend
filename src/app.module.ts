import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { StudentRestrictedGuard } from './common/guards/student-restricted.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './modules/auth/auth.controller';
import { StudentModule } from './modules/student/student.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EmailModule } from './modules/mail/email.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UniversityModule } from './modules/organization/universities/university.module';
// import { AiModule } from './modules/ai/ai.module';
// import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CompaniesModule } from './modules/organization/companies/companies.module';
import { ChatModule } from './modules/chat/chat.module';
import { UsersModule } from './modules/users/users.module';
import { CompanyAdminModule } from './modules/company/admin/company-admin.module';
import { CompanyTrainerModule } from './modules/company/trainer/company-trainer.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiModule } from './modules/ai/ai.module';
import { AuditModule } from './modules/audit/audit.module';
import { UniversityAdminModule } from './modules/university/admin/university-admin.module';
import { UniversitySupervisorModule } from './modules/university/supervisor/university-supervisor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    StudentModule,
    EmailModule,
    NotificationModule,
    UniversityModule,
    CompaniesModule,
    ChatModule,
    CompanyAdminModule,
    CompanyTrainerModule,
    ApplicationsModule,
    TasksModule,
    AttendanceModule,
    EvaluationsModule,
    NotificationsModule,
    AiModule,
    AuditModule,
    UsersModule,
    UniversityAdminModule,
    UniversitySupervisorModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: StudentRestrictedGuard,
    },
  ],
})
export class AppModule { }

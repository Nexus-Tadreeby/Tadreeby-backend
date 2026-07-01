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
    // AiModule,
    // DashboardModule,
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

import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { DatabaseModule } from '../../database/database.module';
import { EmailService } from '../mail/email.service';
import { NotificationService } from '../notification/notification.service';
import { StudentEventsListener } from './listeners/student.events.listener';
import { StudentAdminController } from './admin.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [StudentController, StudentAdminController],
  providers: [
    StudentService,
    EmailService,
    NotificationService,
    StudentEventsListener,
  ],
  exports: [StudentService],
})
export class StudentModule { }

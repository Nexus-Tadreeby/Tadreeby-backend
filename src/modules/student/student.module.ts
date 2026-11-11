import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { DatabaseModule } from '../../database/database.module';
import { EmailService } from '../mail/email.service';
import { NotificationService } from '../notification/notification.service';
import { StudentEventsListener } from './listeners/student.events.listener';
import { StudentAdminController } from './admin.controller';
// import { StudentValidationController } from './student-validation.controller';
import { FilesService } from '../files/files.service';

@Module({
  imports: [DatabaseModule],
  controllers: [StudentController, StudentAdminController,
    //StudentValidationController
  ],
  providers: [
    StudentService,
    EmailService,
    NotificationService,
    StudentEventsListener,
    FilesService,
  ],
  exports: [StudentService, FilesService],
})
export class StudentModule { }

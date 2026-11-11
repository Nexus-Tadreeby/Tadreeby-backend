import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceAbsenceScheduler } from './attendance-absence.scheduler';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [AttendanceController],
    providers: [AttendanceService, AttendanceAbsenceScheduler],
    exports: [AttendanceService],
})
export class AttendanceModule { }

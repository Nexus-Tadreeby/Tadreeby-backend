import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UniversitySupervisorController } from './university-supervisor.controller';
import { UniversitySupervisorService } from './university-supervisor.service';

@Module({
    imports: [DatabaseModule],
    controllers: [UniversitySupervisorController],
    providers: [UniversitySupervisorService],
    exports: [UniversitySupervisorService],
})
export class UniversitySupervisorModule { }

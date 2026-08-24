import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UniversityAdminController } from './university-admin.controller';
import { UniversityAdminService } from './university-admin.service';

@Module({
    imports: [DatabaseModule],
    controllers: [UniversityAdminController],
    providers: [UniversityAdminService],
    exports: [UniversityAdminService],
})
export class UniversityAdminModule { }

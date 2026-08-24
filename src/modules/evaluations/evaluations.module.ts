import { Module } from '@nestjs/common';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [EvaluationsController],
    providers: [EvaluationsService],
    exports: [EvaluationsService],
})
export class EvaluationsModule { }

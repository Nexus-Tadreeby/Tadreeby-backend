import { Module } from '@nestjs/common';
import { CompanyTrainerController } from './company-trainer.controller';
import { CompanyTrainerService } from './company-trainer.service';
import { DatabaseModule } from 'src/database/database.module';
import { SharedNotificationService } from 'src/common/services/notification.service';
import { WebSocketService } from 'src/common/services/websocket.service';

@Module({
    imports: [DatabaseModule],
    controllers: [CompanyTrainerController],
    providers: [CompanyTrainerService, SharedNotificationService, WebSocketService],
    exports: [CompanyTrainerService],
})
export class CompanyTrainerModule { }

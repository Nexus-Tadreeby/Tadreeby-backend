import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { DatabaseModule } from 'src/database/database.module';
import { SharedNotificationService } from 'src/common/services/notification.service';
import { WebSocketService } from 'src/common/services/websocket.service';

@Module({
    imports: [DatabaseModule],
    controllers: [ApplicationsController],
    providers: [ApplicationsService, SharedNotificationService, WebSocketService],
    exports: [ApplicationsService],
})
export class ApplicationsModule { }

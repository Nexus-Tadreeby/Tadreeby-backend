import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { DatabaseModule } from 'src/database/database.module';
import { SharedNotificationService } from 'src/common/services/notification.service';
import { WebSocketService } from 'src/common/services/websocket.service';

@Module({
    imports: [DatabaseModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsGateway, SharedNotificationService, WebSocketService],
    exports: [NotificationsService],
})
export class NotificationsModule { }

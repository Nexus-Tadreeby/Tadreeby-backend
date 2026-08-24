import { Module } from '@nestjs/common';
import { CompanyAdminController } from './company-admin.controller';
import { CompanyAdminService } from './company-admin.service';
import { DatabaseModule } from 'src/database/database.module';
import { SharedNotificationService } from 'src/common/services/notification.service';
import { WebSocketService } from 'src/common/services/websocket.service';

@Module({
    imports: [DatabaseModule],
    controllers: [CompanyAdminController],
    providers: [CompanyAdminService, SharedNotificationService, WebSocketService],
    exports: [CompanyAdminService],
})
export class CompanyAdminModule { }

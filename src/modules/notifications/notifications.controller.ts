import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly service: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'List notifications' })
    async list(@AuthedUser() user: any, @Query('read') read?: string) {
        return this.service.list(user.id, read === 'true' ? true : read === 'false' ? false : undefined);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    async markRead(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.markRead(Number(id), user.id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    async markAllRead(@AuthedUser() user: any) {
        return this.service.markAllRead(user.id);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    async unreadCount(@AuthedUser() user: any) {
        return this.service.unreadCount(user.id);
    }
}

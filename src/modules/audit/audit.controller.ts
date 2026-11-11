import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuditService } from './audit.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
    constructor(private readonly service: AuditService) { }

    @Get('logs')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'List system audit logs' })
    async list(
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.service.list({
            userId: userId ? Number(userId) : undefined,
            action,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        });
    }
}

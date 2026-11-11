import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company/trainer')
export class AttendanceController {
    constructor(private readonly service: AttendanceService) { }

    @Post('attendance')
    @Roles(UserRole.COMPANY_TRAINER)
    @ApiOperation({ summary: 'Mark attendance for a trainee' })
    async create(@Body() dto: any, @AuthedUser() user: any) {
        return this.service.create(user.id, dto);
    }

    @Get('attendance')
    @Roles(UserRole.COMPANY_TRAINER)
    async list(@AuthedUser() user: any, @Query('traineeId') traineeId?: string, @Query('from') from?: string, @Query('to') to?: string) {
        return this.service.list(user.id, traineeId ? Number(traineeId) : undefined, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    }

    @Get('attendance/trainee/:id')
    @Roles(UserRole.COMPANY_TRAINER)
    async monthlySummary(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.monthlySummary(Number(id), user.id);
    }

    @Put('attendance/:id')
    @Roles(UserRole.COMPANY_TRAINER)
    async update(@Param('id') id: string, @Body() dto: any, @AuthedUser() user: any) {
        return this.service.update(Number(id), user.id, dto);
    }

    @Post('attendance/:id/verify')
    @Roles(UserRole.COMPANY_TRAINER)
    async verify(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.verify(Number(id), user.id);
    }

    @Post('attendance/bulk-verify')
    @Roles(UserRole.COMPANY_TRAINER)
    async bulkVerify(@Body() dto: { ids: number[] }, @AuthedUser() user: any) {
        return this.service.bulkVerify(dto.ids, user.id);
    }
}

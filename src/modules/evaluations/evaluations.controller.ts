import { Body, Controller, Get, Param, Put, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { EvaluationsService } from './evaluations.service';

@ApiTags('Evaluations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company/trainer')
export class EvaluationsController {
    constructor(private readonly service: EvaluationsService) { }

    @Post('evaluations')
    @Roles(UserRole.COMPANY_TRAINER)
    async create(@Body() dto: any, @AuthedUser() user: any) {
        return this.service.create(user.id, dto);
    }

    @Get('evaluations')
    @Roles(UserRole.COMPANY_TRAINER)
    async list(@AuthedUser() user: any, @Query('traineeId') traineeId?: string) {
        return this.service.list(user.id, traineeId ? Number(traineeId) : undefined);
    }

    @Get('evaluations/:id')
    @Roles(UserRole.COMPANY_TRAINER)
    async findOne(@Param('id') id: string) {
        return this.service.findOne(Number(id));
    }

    @Put('evaluations/:id')
    @Roles(UserRole.COMPANY_TRAINER)
    async update(@Param('id') id: string, @Body() dto: any, @AuthedUser() user: any) {
        return this.service.update(Number(id), user.id, dto);
    }

    @Get('trainees/:id/summary')
    @Roles(UserRole.COMPANY_TRAINER)
    async summary(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.summary(Number(id), user.id);
    }
}

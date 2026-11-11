import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { CompanyTrainerService } from './company-trainer.service';

@ApiTags('Company Trainer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company/trainer')
export class CompanyTrainerController {
    constructor(private readonly service: CompanyTrainerService) { }

    @Get('dashboard')
    @Roles(UserRole.COMPANY_TRAINER)
    async dashboard(@AuthedUser() user: any) {
        return this.service.getDashboard(user.id, user.companyId);
    }

    @Get('trainees')
    @Roles(UserRole.COMPANY_TRAINER)
    async getTrainees(@AuthedUser() user: any) {
        return this.service.getTrainees(user.id, user.companyId);
    }

    @Get('trainees/:id')
    @Roles(UserRole.COMPANY_TRAINER)
    async getTrainee(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.getTrainee(Number(id), user.id, user.companyId);
    }

    @Get('trainees/:id/progress')
    @Roles(UserRole.COMPANY_TRAINER)
    async getProgress(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.getTraineeProgress(Number(id), user.id, user.companyId);
    }

    @Post('trainees/:id/complete')
    @Roles(UserRole.COMPANY_TRAINER)
    async completeTrainee(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.completeTrainee(Number(id), user.id, user.companyId);
    }
}

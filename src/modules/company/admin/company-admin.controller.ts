import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { CompanyAdminService } from './company-admin.service';

@ApiTags('Company Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company/admin')
export class CompanyAdminController {
    constructor(private readonly service: CompanyAdminService) { }

    @Post('opportunities')
    @Roles(UserRole.COMPANY_ADMIN)
    @ApiOperation({ summary: 'Create a training opportunity' })
    async createOpportunity(@Body() dto: any, @AuthedUser() user: any) {
        return this.service.createOpportunity(user.companyId, dto);
    }

    @Get('opportunities')
    @Roles(UserRole.COMPANY_ADMIN)
    @ApiOperation({ summary: 'List company training opportunities' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async listOpportunities(@AuthedUser() user: any, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.service.listOpportunities(user.companyId, Number(page ?? 1), Number(limit ?? 10));
    }

    @Get('opportunities/:id')
    @Roles(UserRole.COMPANY_ADMIN)
    async findOpportunity(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.findOpportunity(Number(id), user.companyId);
    }

    @Patch('opportunities/:id')
    @Roles(UserRole.COMPANY_ADMIN)
    async updateOpportunity(@Param('id') id: string, @Body() dto: any, @AuthedUser() user: any) {
        return this.service.updateOpportunity(Number(id), user.companyId, dto);
    }

    @Delete('opportunities/:id')
    @Roles(UserRole.COMPANY_ADMIN)
    async deleteOpportunity(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.deleteOpportunity(Number(id), user.companyId);
    }

    @Patch('opportunities/:id/status')
    @Roles(UserRole.COMPANY_ADMIN)
    async setOpportunityStatus(@Param('id') id: string, @Body() dto: { isActive: boolean }, @AuthedUser() user: any) {
        return this.service.setOpportunityStatus(Number(id), user.companyId, dto.isActive);
    }

    @Post('trainers')
    @Roles(UserRole.COMPANY_ADMIN)
    async createTrainer(@Body() dto: any, @AuthedUser() user: any) {
        return this.service.createTrainer(user.companyId, dto);
    }

    @Get('trainers')
    @Roles(UserRole.COMPANY_ADMIN)
    async listTrainers(@AuthedUser() user: any, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.service.listTrainers(user.companyId, Number(page ?? 1), Number(limit ?? 10));
    }

    @Get('trainers/:id')
    @Roles(UserRole.COMPANY_ADMIN)
    async findTrainer(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.findTrainer(Number(id), user.companyId);
    }

    @Patch('trainers/:id')
    @Roles(UserRole.COMPANY_ADMIN)
    async updateTrainer(@Param('id') id: string, @Body() dto: any, @AuthedUser() user: any) {
        return this.service.updateTrainer(Number(id), user.companyId, dto);
    }

    @Patch('trainers/:id/activate')
    @Roles(UserRole.COMPANY_ADMIN)
    async activateTrainer(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.activateTrainer(Number(id), user.companyId);
    }

    @Patch('trainers/:id/deactivate')
    @Roles(UserRole.COMPANY_ADMIN)
    async deactivateTrainer(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.deactivateTrainer(Number(id), user.companyId);
    }

    @Post('trainers/:id/assign-trainees')
    @Roles(UserRole.COMPANY_ADMIN)
    async assignTrainees(@Param('id') id: string, @Body() dto: { traineeIds: number[] }, @AuthedUser() user: any) {
        return this.service.assignTrainees(Number(id), user.companyId, dto.traineeIds);
    }

    @Get('dashboard')
    @Roles(UserRole.COMPANY_ADMIN)
    async dashboard(@AuthedUser() user: any) {
        return this.service.getDashboard(user.companyId);
    }
}

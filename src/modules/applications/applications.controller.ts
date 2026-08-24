import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApplicationStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { ApplicationsService } from './applications.service';

@ApiTags('Company Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company/admin')
export class ApplicationsController {
    constructor(private readonly service: ApplicationsService) { }

    @Get('applications')
    @Roles([UserRole.COMPANY_ADMIN])
    @ApiOperation({ summary: 'List applications for the company admin' })
    @ApiQuery({ name: 'opportunityId', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
    async list(
        @AuthedUser() user: any,
        @Query('opportunityId') opportunityId?: string,
        @Query('status') status?: ApplicationStatus,
    ) {
        return this.service.listCompanyApplications(
            user.companyId,
            opportunityId ? Number(opportunityId) : undefined,
            status,
        );
    }

    @Get('applications/:id')
    @Roles([UserRole.COMPANY_ADMIN])
    @ApiOperation({ summary: 'Fetch one application' })
    async findOne(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.findOneForCompany(Number(id), user.companyId);
    }

    @Post('applications/:id/accept')
    @Roles([UserRole.COMPANY_ADMIN])
    @ApiOperation({ summary: 'Accept an application and create an internship record' })
    async accept(@Param('id') id: string, @AuthedUser() user: any) {
        return this.service.acceptApplication(Number(id), user.companyId);
    }

    @Post('applications/:id/reject')
    @Roles([UserRole.COMPANY_ADMIN])
    @ApiOperation({ summary: 'Reject an application with a reason' })
    async reject(
        @Param('id') id: string,
        @Body() dto: { rejectionReason: string },
        @AuthedUser() user: any,
    ) {
        return this.service.rejectApplication(Number(id), dto.rejectionReason, user.companyId);
    }
}


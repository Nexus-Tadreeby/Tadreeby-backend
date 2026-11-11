import { Body, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { AiService } from './ai.service';

@ApiTags('AI Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company/ai')
export class AiController {
    constructor(private readonly service: AiService) { }

    @Get('benchmarking')
    @Roles([UserRole.COMPANY_ADMIN, UserRole.COMPANY_TRAINER])
    @ApiOperation({ summary: 'Benchmark company internship performance' })
    async benchmarking() {
        return this.service.benchmarking();
    }

    @Get('opportunity-gaps')
    @Roles([UserRole.COMPANY_ADMIN, UserRole.COMPANY_TRAINER])
    async opportunityGaps() {
        return this.service.opportunityGaps();
    }

    @Get('trainee-predictions/:id')
    @Roles([UserRole.COMPANY_ADMIN, UserRole.COMPANY_TRAINER])
    async traineePredictions(@Param('id') id: string) {
        return this.service.traineePredictions(Number(id));
    }

    @Get('task-delay-analysis')
    @Roles([UserRole.COMPANY_ADMIN, UserRole.COMPANY_TRAINER])
    async taskDelayAnalysis() {
        return this.service.taskDelayAnalysis();
    }

    @Get('trainee/:id/performance-summary')
    @Roles([UserRole.COMPANY_ADMIN, UserRole.COMPANY_TRAINER])
    async performanceSummary(@Param('id') id: string) {
        return this.service.performanceSummary(Number(id));
    }

    @Get('student/recommendations')
    @Roles([UserRole.STUDENT])
    async studentRecommendations(@AuthedUser() user: any) {
        return this.service.studentRecommendations(user.id);
    }
}

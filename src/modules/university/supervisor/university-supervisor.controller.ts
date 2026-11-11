import { Body, Controller, Get, Param, Patch, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UniversitySupervisorService } from './university-supervisor.service';
import { CreateSupervisorEvaluationDto } from './dto/create-evaluation.dto';

@ApiTags('University Supervisor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('university/supervisor')
export class UniversitySupervisorController {
    constructor(private readonly service: UniversitySupervisorService) { }

    @Get('dashboard')
    @Roles(UserRole.UNIVERSITY_SUPERVISOR)
    @ApiOperation({ summary: 'Get supervisor dashboard metrics' })
    async dashboard(@AuthedUser() user: any) {
        return this.service.getDashboard(user.universityId, user.id);
    }

    @Get('students')
    @Roles(UserRole.UNIVERSITY_SUPERVISOR)
    @ApiOperation({ summary: 'List students assigned to this supervisor' })
    async listStudents(@AuthedUser() user: any) {
        return this.service.listStudents(user.universityId, user.id);
    }

    @Get('students/:id')
    @Roles(UserRole.UNIVERSITY_SUPERVISOR)
    @ApiOperation({ summary: 'Get assigned student detail' })
    async getStudentDetail(@AuthedUser() user: any, @Param('id') id: string) {
        return this.service.getStudentDetail(user.universityId, user.id, Number(id));
    }

    @Post('students/:id/notes')
    @Roles(UserRole.UNIVERSITY_SUPERVISOR)
    @ApiOperation({ summary: 'Add supervisor notes for a student' })
    async addSupervisorNote(@AuthedUser() user: any, @Param('id') id: string, @Body() dto: { notes: string }) {
        return this.service.addSupervisorNote(user.universityId, user.id, Number(id), dto.notes);
    }

    @Post('evaluations')
    @Roles(UserRole.UNIVERSITY_SUPERVISOR)
    @ApiOperation({ summary: 'Create a supervisor evaluation for a student internship' })
    async createEvaluation(
        @AuthedUser() user: any,
        @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateSupervisorEvaluationDto,
    ) {
        return this.service.createEvaluation(user.id, user.universityId, dto);
    }
}

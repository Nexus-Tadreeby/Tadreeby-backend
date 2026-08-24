import { Body, Controller, Get, Param, Patch, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UniversityAdminService } from './university-admin.service';
import { CreateSupervisorDto } from './dto/create-supervisor.dto';

@ApiTags('University Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('university/admin')
export class UniversityAdminController {
    constructor(private readonly service: UniversityAdminService) { }

    @Get('dashboard')
    @Roles(UserRole.UNIVERSITY_ADMIN)
    @ApiOperation({ summary: 'Get university admin dashboard metrics' })
    async dashboard(@AuthedUser() user: any) {
        return this.service.getDashboard(user.universityId);
    }

    @Get('students')
    @Roles(UserRole.UNIVERSITY_ADMIN)
    @ApiOperation({ summary: 'List university students' })
    async listStudents(@AuthedUser() user: any) {
        return this.service.listStudents(user.universityId);
    }

    @Get('students/:id')
    @Roles(UserRole.UNIVERSITY_ADMIN)
    @ApiOperation({ summary: 'Get university student detail' })
    async getStudentDetail(@AuthedUser() user: any, @Param('id') id: string) {
        return this.service.getStudentDetail(user.universityId, Number(id));
    }

    @Get('supervisors')
    @Roles(UserRole.UNIVERSITY_ADMIN)
    @ApiOperation({ summary: 'List university supervisors' })
    async listSupervisors(@AuthedUser() user: any) {
        return this.service.listSupervisors(user.universityId);
    }

    @Post('supervisors')
    @Roles(UserRole.UNIVERSITY_ADMIN)
    @ApiOperation({ summary: 'Create a university supervisor under the current university' })
    async createSupervisor(
        @AuthedUser() user: any,
        @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateSupervisorDto,
    ) {
        return this.service.createSupervisor(user.universityId, dto);
    }

    @Post('supervisors/:supervisorId/assign-student')
    @Roles(UserRole.UNIVERSITY_ADMIN)
    @ApiOperation({ summary: 'Assign a supervisor to a student in the university' })
    async assignSupervisor(@AuthedUser() user: any, @Param('supervisorId') supervisorId: string, @Body() dto: { studentId: number }) {
        return this.service.assignSupervisorToStudent(user.universityId, Number(supervisorId), dto.studentId);
    }
}

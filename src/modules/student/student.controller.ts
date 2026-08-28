import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { StudentService } from './student.service';
import { RegisterStudentDto } from './dto/register-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProfileOnly } from '../../common/decorators/profile-only.decorator';
import { type authedUserType } from 'src/common/types/unifiedType.types';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod.pipe';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateStudentProfileSchema } from './validation/update-student-profile.validation.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { cvMulterConfig } from 'src/common/config/multer.config';
import { CheckOutDto } from './dto/check-out.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @Post()
  create(@Body() dto: RegisterStudentDto) {
    return this.studentService.create(dto);
  }



  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Get student profile' })
  async getProfile(@AuthedUser() user: authedUserType) {
    const data = await this.studentService.getProfile(user.id);
    return { success: true, data };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Update student profile' })
  async updateProfile(
    @AuthedUser() user: authedUserType,
    @Body(new ZodValidationPipe(UpdateStudentProfileSchema)) dto: UpdateStudentProfileDto,
  ) {
    const data = await this.studentService.updateProfile(user.id, dto);
    return { success: true, data, message: 'Profile updated successfully' };
  }


  @UseGuards(JwtAuthGuard)
  @Patch('profile/cv')
  @Roles([UserRole.STUDENT])
  @UseInterceptors(FileInterceptor('cvFile', cvMulterConfig))
  @ApiOperation({ summary: 'Upload student CV' })
  async uploadCv(
    @AuthedUser() user: authedUserType,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const data = await this.studentService.uploadCv(user.id, file);
    return { success: true, data, message: 'CV uploaded successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile/cv')
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Remove student CV' })
  async removeCv(@AuthedUser() user: authedUserType) {
    const data = await this.studentService.removeCv(user.id);
    return { success: true, data, message: 'CV removed successfully' };
  }


  @UseGuards(JwtAuthGuard)
  @Patch('profile/reupload-document')
  @ProfileOnly()
  async reupload(@Req() req: any, @Body('verificationDocument') verificationDocument: string) {
    const userId = req.user?.sub ?? req.user?.id ?? null;
    return this.studentService.reuploadDocument(userId, verificationDocument);
  }

  @UseGuards(JwtAuthGuard)
  @Get('skills')
  async getSkills(@AuthedUser() user: authedUserType) {
    const data = await this.studentService.getSkills(user.id);
    return { success: true, data, count: data.length };
  }

  @UseGuards(JwtAuthGuard)
  @Get('skills/suggested')
  async getSuggestedSkills() {
    const data = await this.studentService.getSuggestedSkills();
    return { success: true, data, count: data.length };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('skills')
  async updateSkills(@AuthedUser() user: authedUserType, @Body('skills') skills: string[]) {
    const data = await this.studentService.updateSkills(user.id, skills);
    return { success: true, data, message: 'Skills updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('skills/add')
  async addSkill(@AuthedUser() user: authedUserType, @Body('skill') skill: string) {
    const data = await this.studentService.addSkill(user.id, skill);
    return { success: true, data, message: 'Skill added successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('skills/:skill')
  async removeSkill(@AuthedUser() user: authedUserType, @Param('skill') skill: string) {
    const data = await this.studentService.removeSkill(user.id, skill);
    return { success: true, data, message: 'Skill removed successfully' };
  }


  @Get('opportunities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Get available training opportunities' })
  async getAvailableOpportunities(@AuthedUser() user: authedUserType) {
    const data = await this.studentService.getAvailableOpportunities();
    return { success: true, data };
  }


  @Get(['opportunities/:opportunityId', 'opportunity/:opportunityId'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Get a single training opportunity by id' })
  async getOpportunityById(
    @AuthedUser() user: authedUserType,
    @Param('opportunityId') opportunityId: string,
  ) {
    const data = await this.studentService.getOpportunityById(user.id, +opportunityId);
    return { success: true, data };
  }

  @Get('internships')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Get student internships' })
  async getInternships(@AuthedUser() user: authedUserType) {
    const data = await this.studentService.getInternships(user.id);
    return { success: true, data };
  }

  // @Post('apply/:opportunityId')
  @Post(['opportunities/:opportunityId/apply', 'opportunity/:opportunityId/apply'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Apply for a training opportunity' })
  async applyForOpportunity(
    @AuthedUser() user: authedUserType,
    @Param('opportunityId') opportunityId: string,
  ) {
    const data = await this.studentService.applyForOpportunity(user.id, +opportunityId);
    return { success: true, data, message: 'Application submitted successfully' };
  }


  // @Get('internship/:internshipId')
  @Get(['internships/:internshipId', 'internship/:internshipId'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Get internship details with tasks and submissions' })
  async getInternshipDetails(
    @AuthedUser() user: authedUserType,
    @Param('internshipId') internshipId: string,
  ) {
    const data = await this.studentService.getInternshipDetails(user.id, +internshipId);
    return { success: true, data };
  }




  @Get('tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Get student tasks' })
  async getTasks(@AuthedUser() user: authedUserType) {
    const data = await this.studentService.getTasks(user.id);
    return { success: true, data };
  }






  @Get('attendance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Get student attendance' })
  async getAttendance(@AuthedUser() user: authedUserType) {
    const data = await this.studentService.getAttendance(user.id);
    return { success: true, data };
  }

  @Post('attendance/check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Check in to an internship' })
  async checkIn(
    @AuthedUser() user: authedUserType,
    @Body() dto: { internshipId: number },
  ) {
    const data = await this.studentService.checkIn(user.id, dto.internshipId);
    return { success: true, data, message: 'Checked in successfully' };
  }


  @Patch('attendance/check-out')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Check out from current session (forced to 4 PM)' })
  async checkOut(
    @AuthedUser() user: authedUserType,
    @Body() dto: CheckOutDto, 
  ) {
    const data = await this.studentService.checkOut(user.id);
    return { success: true, data, message: 'Checked out successfully at 4:00 PM' };
  }
  // @Patch('attendance/check-out')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles([UserRole.STUDENT])
  // @ApiOperation({ summary: 'Check out from current session' })
  // async checkOut(@AuthedUser() user: authedUserType) {
  //   const data = await this.studentService.checkOut(user.id);
  //   return { success: true, data, message: 'Checked out successfully' };
  // }


  @Get('evaluations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Get student evaluations' })
  async getEvaluations(@AuthedUser() user: authedUserType) {
    const data = await this.studentService.getEvaluations(user.id);
    return { success: true, data };
  }




  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.STUDENT])
  @ApiOperation({ summary: 'Get student dashboard' })
  async getDashboard(@AuthedUser() user: authedUserType) {
    const data = await this.studentService.getDashboard(user.id);
    return { success: true, data };
  }

}

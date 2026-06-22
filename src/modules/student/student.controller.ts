import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { StudentService } from './student.service';
import { RegisterStudentDto } from './dto/register-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProfileOnly } from '../../common/decorators/profile-only.decorator';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @Post()
  create(@Body() dto: RegisterStudentDto) {
    return this.studentService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/reupload-document')
  @ProfileOnly()
  async reupload(@Req() req: any, @Body('verificationDocument') verificationDocument: string) {
    const userId = req.user?.sub ?? req.user?.id ?? null;
    return this.studentService.reuploadDocument(userId, verificationDocument);
  }

  // @Get()
  // findAll() {
  //   return this.studentService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.studentService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
  //   return this.studentService.update(+id, updateStudentDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.studentService.remove(+id);
  // }
}

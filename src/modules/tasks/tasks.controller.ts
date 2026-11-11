import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { taskFileMulterConfig } from 'src/common/config/multer.config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company/trainer')
export class TasksController {
    constructor(private readonly service: TasksService) { }

    @Post('tasks')
    @Roles(UserRole.COMPANY_TRAINER)
    @ApiOperation({ summary: 'Create a task for an internship' })
    async create(@Body() dto: any, @AuthedUser() user: any) {
        return this.service.create(user.id, dto);
    }

    @Get('tasks')
    @Roles(UserRole.COMPANY_TRAINER)
    async list(@AuthedUser() user: any, @Query('traineeId') traineeId?: string, @Query('status') status?: string) {
        return this.service.list(user.id, traineeId ? Number(traineeId) : undefined, status);
    }

    @Get('tasks/:id')
    @Roles(UserRole.COMPANY_TRAINER)
    async findOne(@Param('id') id: string) {
        return this.service.findOne(Number(id));
    }

    @Patch('tasks/:id')
    @Roles(UserRole.COMPANY_TRAINER)
    async update(@Param('id') id: string, @Body() dto: any) {
        return this.service.update(Number(id), dto);
    }

    @Delete('tasks/:id')
    @Roles(UserRole.COMPANY_TRAINER)
    async remove(@Param('id') id: string) {
        return this.service.remove(Number(id));
    }

    @Post('tasks/:id/assign')
    @Roles(UserRole.COMPANY_TRAINER)
    async assign(@Param('id') id: string, @Body() dto: { traineeId: number }) {
        return this.service.assign(Number(id), dto.traineeId);
    }

    @Post('tasks/:id/unassign')
    @Roles(UserRole.COMPANY_TRAINER)
    async unassign(@Param('id') id: string, @Body() dto: { traineeId: number }) {
        return this.service.unassign(Number(id), dto.traineeId);
    }

    @Post('tasks/:id/attachments')
    @Roles(UserRole.COMPANY_TRAINER)
    @UseInterceptors(FileInterceptor('file', taskFileMulterConfig))
    async uploadTaskAttachment(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @AuthedUser() user: any) {
        return this.service.uploadAttachment(Number(id), user.id, file);
    }
}

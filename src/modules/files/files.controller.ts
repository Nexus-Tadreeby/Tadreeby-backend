import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import * as path from 'path';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

import { FilesService, FileType } from './files.service';
import { ApiSuccessResponse, MessageResponse } from 'src/common/types/unifiedType.types';
import { profileImageMulterConfig, cvMulterConfig, verificationDocMulterConfig, taskFileMulterConfig } from 'src/common/config/multer.config';


const profileImageOptions = { ...profileImageMulterConfig };
const cvOptions = { ...cvMulterConfig };
const verificationDocOptions = { ...verificationDocMulterConfig };
const taskFileOptions = { ...taskFileMulterConfig };

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }



  @Post('profile')
  @Roles([UserRole.STUDENT, UserRole.UNIVERSITY_ADMIN, UserRole.COMPANY_ADMIN, UserRole.UNIVERSITY_SUPERVISOR, UserRole.COMPANY_TRAINER])
  @UseInterceptors(FileInterceptor('file', profileImageOptions))
  @ApiOperation({ summary: 'Upload profile image (max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, WEBP) - Max 5MB',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        success: true,
        data: {
          filename: '1732456789123-abc123.jpg',
          url: 'http://localhost:5173/files/profile/1/1732456789123-abc123.jpg',
          message: 'Profile image uploaded successfully',
        },
      },
    },
  })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<{ filename: string; url: string; message: string }>> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    await this.filesService.deleteFile(FileType.PROFILE, user.id);
    const result = await this.filesService.uploadFile(file, FileType.PROFILE, user.id, user.firstName, user.lastName);

    return {
      success: true,
      data: {
        filename: result.filename,
        url: result.url,
        message: 'Profile image uploaded successfully',
      },
    };
  }





  @Post('cv')
  @Roles([UserRole.STUDENT])
  @UseInterceptors(FileInterceptor('file', cvOptions))
  @ApiOperation({ summary: 'Upload CV (max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF or Word document - Max 5MB',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        success: true,
        data: {
          filename: '1732456789123-abc123.pdf',
          url: 'http://localhost:5173/files/cv/1/1732456789123-abc123.pdf',
          message: 'CV uploaded successfully',
        },
      },
    },
  })
  async uploadCV(
    @UploadedFile() file: Express.Multer.File,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<{ filename: string; url: string; message: string }>> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    await this.filesService.deleteFile(FileType.CV, user.id);
    const result = await this.filesService.uploadFile(file, FileType.CV, user.id, user.firstName, user.lastName);

    return {
      success: true,
      data: {
        filename: result.filename,
        url: result.url,
        message: 'CV uploaded successfully',
      },
    };
  }





  @Post('verification')
  @Roles([UserRole.STUDENT])
  @UseInterceptors(FileInterceptor('file', verificationDocOptions))
  @ApiOperation({ summary: 'Upload verification document (max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF or image of verification document - Max 5MB',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        success: true,
        data: {
          filename: '1732456789123-abc123.pdf',
          url: 'http://localhost:5173/files/verification/1/1732456789123-abc123.pdf',
          message: 'Verification document uploaded successfully',
        },
      },
    },
  })
  async uploadVerificationDocument(
    @UploadedFile() file: Express.Multer.File,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<{ filename: string; url: string; message: string }>> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    await this.filesService.deleteFile(FileType.VERIFICATION, user.id);
    const result = await this.filesService.uploadFile(file, FileType.VERIFICATION, user.id, user.firstName, user.lastName);

    return {
      success: true,
      data: {
        filename: result.filename,
        url: result.url,
        message: 'Verification document uploaded successfully',
      },
    };
  }







  @Delete('profile')
  @Roles([UserRole.STUDENT, UserRole.UNIVERSITY_ADMIN, UserRole.COMPANY_ADMIN, UserRole.UNIVERSITY_SUPERVISOR, UserRole.COMPANY_TRAINER])
  @ApiOperation({ summary: 'Delete profile image' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        success: true,
        data: {
          message: 'Profile image deleted successfully',
        },
      },
    },
  })
  async deleteProfileImage(
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<MessageResponse>> {
    await this.filesService.deleteFile(FileType.PROFILE, user.id);
    return {
      success: true,
      data: {
        message: 'Profile image deleted successfully',
      },
    };
  }




  @Delete('cv')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Delete CV' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        success: true,
        data: {
          message: 'CV deleted successfully',
        },
      },
    },
  })
  async deleteCV(
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<MessageResponse>> {
    await this.filesService.deleteFile(FileType.CV, user.id);
    return {
      success: true,
      data: {
        message: 'CV deleted successfully',
      },
    };
  }




  @Delete('verification')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Delete verification document' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        success: true,
        data: {
          message: 'Verification document deleted successfully',
        },
      },
    },
  })
  async deleteVerificationDocument(
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<MessageResponse>> {
    await this.filesService.deleteFile(FileType.VERIFICATION, user.id);
    return {
      success: true,
      data: {
        message: 'Verification document deleted successfully',
      },
    };
  }




  @Get(':type/:userId/:filename')
  @ApiOperation({ summary: 'Get file' })
  async getFile(
    @Param('type') type: string,
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const filePath = path.join(
      process.env.UPLOAD_PATH || './uploads',
      type,
      userId,
      filename,
    );

    const fileStream = createReadStream(filePath);
    res.set({
      'Content-Type': this.getContentType(filename),
      'Content-Disposition': `inline; filename="${filename}"`,
    });

    return new StreamableFile(fileStream);
  }




  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const types: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
    };
    return types[ext] || 'application/octet-stream';
  }
}
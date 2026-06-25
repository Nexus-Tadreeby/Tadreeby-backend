import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

export enum FileType {
  PROFILE = 'profile',
  CV = 'cv',
  VERIFICATION = 'verification',
  TASK = 'task',
}

@Injectable()
export class FilesService {
  constructor(private readonly prisma: DatabaseService) { }

  // ✅ Maximum file size: 5MB
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // ============================================
  // ✅ GET FILE PATH
  // ============================================

  getFilePath(type: FileType, userId: number, filename: string): string {
    const basePath = process.env.UPLOAD_PATH || './uploads';
    const folderMap = {
      [FileType.PROFILE]: `profiles/${userId}`,
      [FileType.CV]: `cvs/${userId}`,
      [FileType.VERIFICATION]: `documents/${userId}`,
      [FileType.TASK]: `tasks/${userId}`,
    };
    return path.join(basePath, folderMap[type], filename);
  }

  // ============================================
  // ✅ GET FILE URL
  // ============================================

  getFileUrl(type: FileType, userId: number, filename: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/api/v1/files/${type}/${userId}/${filename}`;
  }

  // ============================================
  // ✅ UPLOAD FILE
  // ============================================

  async uploadFile(
    file: Express.Multer.File,
    type: FileType,
    userId: number,
  ): Promise<{ filename: string; url: string; path: string }> {
    // ✅ Validate file (with 10MB limit)
    this.validateFile(file);

    // Create folder if not exists
    const folderPath = path.join(
      process.env.UPLOAD_PATH || './uploads',
      type,
      String(userId),
    );
    this.ensureFolderExists(folderPath);

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = path.join(folderPath, filename);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Update database based on type
    await this.updateUserFile(type, userId, filename);

    return {
      filename,
      url: this.getFileUrl(type, userId, filename),
      path: filePath,
    };
  }

  // ============================================
  // ✅ DELETE FILE
  // ============================================

  async deleteFile(type: FileType, userId: number): Promise<void> {
    // Get current filename from database
    const currentFile = await this.getCurrentFile(type, userId);

    if (!currentFile) {
      return; // No file to delete
    }

    // Delete physical file
    const filePath = this.getFilePath(type, userId, currentFile);
    try {
      await unlinkAsync(filePath);
    } catch (error) {
      // File doesn't exist, ignore
    }

    // Update database
    await this.clearUserFile(type, userId);
  }

  // ============================================
  // ✅ GET CURRENT FILE
  // ============================================

  async getCurrentFile(type: FileType, userId: number): Promise<string | null> {
    switch (type) {
      case FileType.PROFILE:
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { profileImage: true },
        });
        return user?.profileImage || null;

      case FileType.CV:
        const student = await this.prisma.studentProfile.findUnique({
          where: { userId },
          select: { cvUrl: true },
        });
        return student?.cvUrl || null;

      case FileType.VERIFICATION:
        const profile = await this.prisma.studentProfile.findUnique({
          where: { userId },
          select: { verificationDocument: true },
        });
        return profile?.verificationDocument || null;

      default:
        return null;
    }
  }

  // ============================================
  // ✅ GET FILE SIZE (optional)
  // ============================================

  async getFileSize(type: FileType, userId: number, filename: string): Promise<number> {
    const filePath = this.getFilePath(type, userId, filename);
    const stats = await fs.promises.stat(filePath);
    return stats.size;
  }

  // ============================================
  // ✅ PRIVATE METHODS
  // ============================================

  private validateFile(file: Express.Multer.File): void {
    // ✅ 5MB limit
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`
      );
    }

    // Allowed file types
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP, SVG, PDF, DOC, DOCX, XLS, XLSX, TXT'
      );
    }
  }

  private ensureFolderExists(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  private async updateUserFile(type: FileType, userId: number, filename: string): Promise<void> {
    switch (type) {
      case FileType.PROFILE:
        await this.prisma.user.update({
          where: { id: userId },
          data: { profileImage: filename },
        });
        break;

      case FileType.CV:
        await this.prisma.studentProfile.update({
          where: { userId },
          data: { cvUrl: filename },
        });
        break;

      case FileType.VERIFICATION:
        await this.prisma.studentProfile.update({
          where: { userId },
          data: { verificationDocument: filename },
        });
        break;

      default:
        break;
    }
  }

  private async clearUserFile(type: FileType, userId: number): Promise<void> {
    switch (type) {
      case FileType.PROFILE:
        await this.prisma.user.update({
          where: { id: userId },
          data: { profileImage: null },
        });
        break;

      case FileType.CV:
        await this.prisma.studentProfile.update({
          where: { userId },
          data: { cvUrl: null },
        });
        break;

      case FileType.VERIFICATION:
        await this.prisma.studentProfile.update({
          where: { userId },
          data: { verificationDocument: '' },
        });
        break;

      default:
        break;
    }
  }
}
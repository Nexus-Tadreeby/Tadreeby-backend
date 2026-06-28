import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegisterStudentDto } from './dto/register-student.dto';
import { StudentApprovalStatus, UserRole } from '@prisma/client';
import { StudentRegisteredEvent } from './events/student-registered.event';
import { hashPassword } from '../auth/utils/crypto.util';
import { removeFields } from '../../common/utils/object.util';
import { AuthUserResponse } from 'src/common/types/unifiedType.types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StudentService {


  constructor(
    private readonly prisma: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) { }


  async create(dto: RegisterStudentDto): Promise<AuthUserResponse> {

    const email = this.normalizeEmail(dto.email)
    const phoneNumber = dto.phone.trim()

    await this.ensureEmailNotUsed(dto.email)
    await this.ensurePersonalIdNotUsed(dto.personalID);

    const hashedPassword = await hashPassword(dto.password);

    let verificationFileName = '' 
    if (dto.verificationDocument) {
      try {

        const base64Data = dto.verificationDocument.replace(/^data:.*?;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

      
        const ext = this.getFileExtension(dto.verificationDocument);

        const baseName = this.generateVerificationFileName(dto.firstName, dto.lastName);
        const filename = `${baseName}${ext}`;
        // const filename = `verification-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;

        const uploadDir = process.env.UPLOAD_PATH || './uploads/pending';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        // fs.writeFileSync(filePath, buffer);
        await fs.promises.writeFile(filePath, buffer);

        verificationFileName = filename; 
        console.log(`✅ File saved: ${filePath}`);
      } catch (error) {
        console.error('❌ Error saving verification document:', error);
        throw new ConflictException('Failed to save verification document');
      }
    }

    //! try & catch

    const student = await this.prisma.$transaction(async (tx) => {
      //* create student as user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          personalID: dto.personalID,
          phone: phoneNumber,
          role: UserRole.STUDENT,
          universityId: dto.universityId,
        },
      });

      //* create student profile
      await tx.studentProfile.create({
        data: {
          userId: user.id,
          universityId: dto.universityId,
          studentNumber: dto.studentNumber,
          major : dto.major,
          // verificationDocument: dto.verificationDocument,
          verificationDocument: verificationFileName,
          approvalStatus: StudentApprovalStatus.PENDING,
        },
      });

      const userWithoutPassword = removeFields(user, ['password']);

      // fetch the created profile within the transaction (we already created it above)
      const profile = await tx.studentProfile.findUnique({ where: { userId: user.id } });

      return { ...userWithoutPassword, studentProfile: profile };
      // return { userWithoutPassword, studentProfile };
    })

    // //*  event
    // this.eventEmitter.emit(
    //   'student.registered',
    //   new StudentRegisteredEvent(
    //     student.id,
    //     dto.universityId,
    //     dto.verificationDocument,
    //   ),
    // );

    // this.eventEmitter.emit('student.registered', student);



    // this.eventEmitter.emit(
    //   'student.registered',
    //   new StudentRegisteredEvent(student.id, student.email),
    // );



    // emit registered event to trigger notifications and emails
    this.eventEmitter.emit(
      'student.registered',
      new StudentRegisteredEvent(student.id, dto.universityId),
    );

    return student;
    // return {
    //   message: 'Registration successful. Pending approval.',
    //   user: student.userWithoutPassword,
    // };

  }

  private getFileExtension(base64: string): string {
    if (base64.includes('data:image/png')) return '.png';
    if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg'))
      return '.jpg';
    if (base64.includes('data:image/gif')) return '.gif';
    if (base64.includes('data:image/webp')) return '.webp';
    if (base64.includes('data:application/pdf')) return '.pdf';
    return '.pdf';
  }

  
  private async ensurePersonalIdNotUsed(personalID: number ): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { personalID },
    });

    if (existingUser) {
      throw new ConflictException('Personal ID already exists');
    }
  }

  normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }


  private async ensureEmailNotUsed(email: string) {
    const db = this.prisma;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');
  }


  // findAll() {
  //   return `This action returns all student`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} student`;
  // }

  // update(id: number, updateStudentDto: UpdateStudentDto) {
  //   return `This action updates a #${id} student`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} student`;
  // }
  // remove(id: number) {
  //   return `This action removes a #${id} student`;
  // }

  async reuploadDocument(userId: number, verificationDocument: string) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw new ConflictException('Profile not found');

    if (
      profile.approvalStatus !== StudentApprovalStatus.PENDING &&
      profile.approvalStatus !== StudentApprovalStatus.REJECTED
    ) {
      throw new ConflictException('Cannot reupload document unless status is PENDING or REJECTED');
    }

    const updated = await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        verificationDocument,
        approvalStatus: StudentApprovalStatus.PENDING,
        rejectionReason: null,
        approvedAt: null,
      },
    });

    // emit event for reuploaded document
    this.eventEmitter.emit('student.document.reuploaded', {
      studentId: userId,
      universityId: updated.universityId,
    });

    return updated;
  }



  private sanitizeFileName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\-]/g, ''); 
  }


  private generateVerificationFileName(firstName: string, lastName: string): string {
    const safeFirst = this.sanitizeFileName(firstName);
    const safeLast = this.sanitizeFileName(lastName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    //  Shahd_abu_sharif_verification_document_1782458095747_a1b2c3.pdf
    return `${safeFirst}_${safeLast}_verification_document_${timestamp}_${random}`;
  }



}

import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegisterStudentDto } from './dto/register-student.dto';
import { StudentApprovalStatus, UserRole } from '@prisma/client';
import { StudentRegisteredEvent } from './events/student-registered.event';
import { hashPassword } from '../auth/utils/crypto.util';
import { removeFields } from '../../common/utils/object.util';

@Injectable()
export class StudentService {


  constructor(
    private readonly prisma: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) { }


  async create(dto: RegisterStudentDto) {

    const email = this.normalizeEmail(dto.email)
    const phoneNumber = dto.phone.trim()

    await this.ensureEmailNotUsed(dto.email)

    const hashedPassword = await hashPassword(dto.password);

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
          verificationDocument: dto.verificationDocument,
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
}

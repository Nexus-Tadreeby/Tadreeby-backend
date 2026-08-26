import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegisterStudentDto } from './dto/register-student.dto';
import { AttendanceStatus, InternshipStatus, StudentApprovalStatus, TaskStatus, UserRole } from '@prisma/client';
import { StudentRegisteredEvent } from './events/student-registered.event';
import { hashPassword } from '../auth/utils/crypto.util';
import { removeFields } from '../../common/utils/object.util';
import { AuthUserResponse } from 'src/common/types/unifiedType.types';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { convertBigIntFields } from 'src/common/utils/bigint.util';

@Injectable()
export class StudentService {


  constructor(
    private readonly prisma: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) { }


  async create(dto: Omit<RegisterStudentDto, 'confirmPassword'>): Promise<AuthUserResponse> {

    const email = this.normalizeEmail(dto.email)
    const phoneNumber = dto.phone.trim()

    await this.ensureEmailNotUsed(dto.email)
    await this.ensurePersonalIdNotUsed(dto.personalID);
    await this.ensureStudentNumberNotUsed(dto.studentNumber, dto.universityId);


    const hashedPassword = await hashPassword(dto.password);

    const verificationFileName = dto.verificationDocument || '';

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
          studentNumber: BigInt(dto.studentNumber),
          major: dto.major,
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

    const formattedStudent = {
      ...student,
      studentProfile: student.studentProfile ? {
        ...student.studentProfile,
        studentNumber: Number(student.studentProfile.studentNumber),
      } : null,
    };

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

    return formattedStudent;
    // return {
    //   message: 'Registration successful. Pending approval.',
    //   user: student.userWithoutPassword,
    // };

  }







  async getProfile(userId: number) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            recoveryEmail: true,
            createdAt: true,
          },
        },
        university: {
          select: {
            id: true,
            name: true,
            shortCode: true,
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Student profile not found');
    // return profile;
    return convertBigIntFields(profile);
  }

  async updateProfile(userId: number, dto: UpdateStudentProfileDto) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Student profile not found');

    // // Update user fields if provided
    // if (dto.firstName || dto.lastName || dto.phone) {
    //   await this.prisma.user.update({
    //     where: { id: userId },
    //     data: {
    //       firstName: dto.firstName,
    //       lastName: dto.lastName,
    //       phone: dto.phone,
    //     },
    //   });
    // }


    // Prepare user update data
    const userUpdateData: any = {};
    // if (dto.firstName) userUpdateData.firstName = dto.firstName;
    // if (dto.lastName) userUpdateData.lastName = dto.lastName;
    if (dto.phone) userUpdateData.phone = dto.phone;
    if (dto.profileImage !== undefined) userUpdateData.profileImage = dto.profileImage;
    if (dto.recoveryEmail !== undefined) userUpdateData.recoveryEmail = dto.recoveryEmail; 
    if (Object.keys(userUpdateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // Prepare student profile update data
    const studentUpdateData: any = {};
    // if (dto.major) studentUpdateData.major = dto.major;
    // if (dto.academicYear !== undefined) studentUpdateData.academicYear = dto.academicYear;
    if (dto.gpa !== undefined) studentUpdateData.gpa = dto.gpa;
    if (dto.cvFile) studentUpdateData.cvUrl = dto.cvFile; // store base64

    const updated = await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        // major: dto.major,
        // academicYear: dto.academicYear,
        gpa: dto.gpa,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            recoveryEmail: true,
            phone: true,
            profileImage: true,

          },
        },
      },
    });

    // ✅ Convert BigInt AND return the data
    return convertBigIntFields(updated);
  }



  // async updateProfile(userId: number, dto: UpdateStudentProfileDto) {
  //   const profile = await this.prisma.studentProfile.findUnique({
  //     where: { userId },
  //   });
  //   if (!profile) throw new NotFoundException('Student profile not found');

  //   if (dto.firstName || dto.lastName || dto.phone) {
  //     await this.prisma.user.update({
  //       where: { id: userId },
  //       data: {
  //         firstName: dto.firstName,
  //         lastName: dto.lastName,
  //         phone: dto.phone,
  //       },
  //     });
  //   }

  //   // return this.prisma.studentProfile.update({
  //   //   where: { userId },
  //   //   data: {
  //   //     major: dto.major,
  //   //     academicYear: dto.academicYear,
  //   //     gpa: dto.gpa,
  //   //   },
  //   //   include: {
  //   //     user: {
  //   //       select: {
  //   //         id: true,
  //   //         firstName: true,
  //   //         lastName: true,
  //   //         email: true,
  //   //         phone: true,
  //   //         profileImage: true,
  //   //       },
  //   //     },
  //   //   },
  //   // });


  //   const updated = await this.prisma.studentProfile.update({
  //     where: { userId },
  //     data: {
  //       major: dto.major,
  //       academicYear: dto.academicYear,
  //       gpa: dto.gpa,
  //     },
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           firstName: true,
  //           lastName: true,
  //           email: true,
  //           phone: true,
  //           profileImage: true,
  //         },
  //       },
  //     },
  //   });

  //   // ✅ Convert BigInt to Number, Date to ISO string
  //   return convertBigIntFields(updated);
  // }



  // async getAvailableOpportunities() {
  //   const opportunities = await this.prisma.trainingOpportunity.findMany({
  //     where: { isActive: true },
  //     include: { company: true },
  //     orderBy: { id: 'desc' },
  //   });

  //   return opportunities.map((opportunity) => {
  //     const requiredSkills = opportunity.requiredSkills
  //       ? opportunity.requiredSkills
  //         .split(',')
  //         .map(skill => skill.trim())
  //         .filter(Boolean)
  //       : [];

  //     return {
  //       id: opportunity.id,
  //       company: opportunity.company?.name || 'Company',
  //       internship: opportunity.title,
  //       field: opportunity.title,
  //       trainer: 'Company Team',
  //       seats: opportunity.totalSeats,
  //       requiredSkills,
  //       type: opportunity.type === 'REMOTE' ? 'Remote' : opportunity.type === 'HYBRID' ? 'Hybrid' : 'On-site',
  //       location: opportunity.location || 'Remote',
  //       startDate: 'Open now',
  //       endDate: opportunity.duration || 'Flexible',
  //       image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
  //       description: opportunity.description,
  //     };
  //   });
  // }



  async getAvailableOpportunities() {
    const opportunities = await this.prisma.trainingOpportunity.findMany({
      where: {
        isActive: true,
        totalSeats: {
          gt: 0,
        },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            location: true,
          },
        },

        internships: {
          include: {
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },

            university: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
      },

      orderBy: {
        id: 'desc',
      },
    });

    return opportunities.map((opportunity) => ({
      ...opportunity,

      requiredSkills: opportunity.requiredSkills
        ? opportunity.requiredSkills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
        : [],
    }));
  }



  async getOpportunityById(userId: number, opportunityId: number) {
    const opportunity = await this.prisma.trainingOpportunity.findUnique({
      where: { id: opportunityId, isActive: true },
      include: { company: true },
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    return this.mapOpportunity(opportunity);
  }

  private mapOpportunity(opportunity: any) {
    const requiredSkills = opportunity.requiredSkills
      ? opportunity.requiredSkills
        .split(',')
        .map((skill: string) => skill.trim())
        .filter(Boolean)
      : [];

    return {
      id: opportunity.id,
      company: opportunity.company?.name || 'Company',
      companyId: opportunity.companyId,
      internship: opportunity.title,
      field: opportunity.title,
      trainer: 'Company Team',
      seats: opportunity.totalSeats,
      requiredSkills,
      type: opportunity.type === 'REMOTE' ? 'Remote' : opportunity.type === 'HYBRID' ? 'Hybrid' : 'On-site',
      location: opportunity.location || 'Remote',
      startDate: 'Open now',
      endDate: opportunity.duration || 'Flexible',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
      description: opportunity.description,
    };
  }











  async uploadCv(userId: number, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('CV file is required');

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Please upload a PDF, DOC, or DOCX file');
    }

    const cvFile = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const updatedProfile = await this.prisma.studentProfile.update({
      where: { userId },
      data: { cvUrl: cvFile },
      select: {
        userId: true,
        cvUrl: true,
        user: {
          select: {
            recoveryEmail: true,
          },
        },
      },
    });

    return convertBigIntFields(updatedProfile);
  }


  async removeCv(userId: number) {
    const updatedProfile = await this.prisma.studentProfile.update({
      where: { userId },
      data: { cvUrl: null },
      select: {
        userId: true,
        cvUrl: true,
        user: {
         select: {
           recoveryEmail: true,
         },
        },
      },
    });

    return convertBigIntFields(updatedProfile);
  }

  async getSkills(userId: number): Promise<string[]> {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { skills: true },
    });
    if (!profile) throw new NotFoundException('Student profile not found');
    return profile.skills ? JSON.parse(profile.skills) : [];
  }




  async updateSkills(userId: number, skills: string[]): Promise<string[]> {
    if (!Array.isArray(skills)) {
      throw new BadRequestException('Skills must be an array of strings');
    }
    const cleanedSkills = skills
      .map(s => this.normalizeSkill(s))
      .filter(s => s.length > 0)
      .filter((s, i, arr) => arr.indexOf(s) === i);
    if (cleanedSkills.length === 0) {
      throw new BadRequestException('At least one skill is required');
    }
    await this.prisma.studentProfile.update({
      where: { userId },
      data: { skills: JSON.stringify(cleanedSkills) },
    });
    return cleanedSkills;
  }




  async addSkill(userId: number, skill: string): Promise<string[]> {
    const currentSkills = await this.getSkills(userId);
    const normalized = this.normalizeSkill(skill);
    if (!normalized) throw new BadRequestException('Invalid skill');
    if (currentSkills.includes(normalized)) {
      throw new BadRequestException('Skill already exists');
    }
    const updated = [...currentSkills, normalized];
    await this.prisma.studentProfile.update({
      where: { userId },
      data: { skills: JSON.stringify(updated) },
    });
    return updated;
  }




  async removeSkill(userId: number, skill: string): Promise<string[]> {
    const currentSkills = await this.getSkills(userId);
    const normalized = this.normalizeSkill(skill);
    if (!currentSkills.includes(normalized)) {
      throw new NotFoundException('Skill not found');
    }
    const updated = currentSkills.filter(s => s !== normalized);
    await this.prisma.studentProfile.update({
      where: { userId },
      data: { skills: JSON.stringify(updated) },
    });
    return updated;
  }



  async getSuggestedSkills(): Promise<string[]> {
    const opportunities = await this.prisma.trainingOpportunity.findMany({
      where: { isActive: true },
      select: { requiredSkills: true },
    });
    const skillSet = new Set<string>();
    opportunities.forEach(opp => {
      if (opp.requiredSkills) {
        opp.requiredSkills.split(',').forEach(s => {
          const normalized = this.normalizeSkill(s);
          if (normalized) skillSet.add(normalized);
        });
      }
    });
    return Array.from(skillSet).sort();
  }



  private normalizeSkill(skill: string): string {
    return skill.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9\s#+.]/g, '');
  }





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

    // return updated;
    return convertBigIntFields(updated);
  }





  async getInternships(userId: number) {
    return this.prisma.internshipStudent.findMany({
      where: { studentId: userId },
      include: {
        internship: {
          include: {
            opportunity: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }


  async applyForOpportunity(userId: number, opportunityId: number) {

    const opportunity = await this.prisma.trainingOpportunity.findUnique({
      where: { id: opportunityId, isActive: true },
    });

    if (!opportunity) throw new NotFoundException('Opportunity not found');

    const existing = await this.prisma.internshipStudent.findFirst({
      where: {
        studentId: userId,
        internship: {
          opportunityId,
        },
      },
    });

    if (existing) throw new ConflictException('Already applied for this opportunity');

    // Get student's university
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { universityId: true },
    });

    if (!student) throw new NotFoundException('Student profile not found');

    const internship = await this.prisma.internship.create({
      data: {
        opportunityId,
        companyId: opportunity.companyId,
        universityId: student.universityId,
        status: InternshipStatus.ACTIVE,
      },
    });

    return this.prisma.internshipStudent.create({
      data: {
        studentId: userId,
        internshipId: internship.id,
      },
      include: {
        internship: {
          include: {
            opportunity: true,
            company: true,
          },
        },
      },
    });
  }



  async getTasks(userId: number) {
    return this.prisma.task.findMany({
      where: {
        internship: {
          students: {
            some: {
              studentId: userId,
            },
          },
        },
      },
      include: {
        submissions: {
          where: { studentId: userId },
        },
      },
      orderBy: { deadline: 'asc' },
    });
  }



  async getAttendance(userId: number) {
    return this.prisma.attendance.findMany({
      where: { studentId: userId },
      include: {
        internship: {
          include: {
            opportunity: true,
            company: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }




  async checkIn(userId: number, internshipId: number) {
    // Check if student is enrolled in this internship
    const enrolled = await this.prisma.internshipStudent.findFirst({
      where: {
        studentId: userId,
        internshipId,
      },
    });

    if (!enrolled) throw new ForbiddenException('You are not enrolled in this internship');

    // Check if already checked in today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        internshipId,
        studentId: userId,
        date: { gte: startOfDay, lt: endOfDay },
      },
    });

    if (existing) throw new ConflictException('Already checked in today');

    return this.prisma.attendance.create({
      data: {
        internshipId,
        studentId: userId,
        date: new Date(),
        status: AttendanceStatus.CHECKED_IN,
      },
      include: {
        internship: {
          include: {
            opportunity: true,
            company: true,
          },
        },
      },
    });
  }





  async getEvaluations(userId: number) {
    return this.prisma.evaluation.findMany({
      where: { studentId: userId },
      include: {
        evaluator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        internship: {
          include: {
            opportunity: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }




  async getDashboard(userId: number) {
    const [profile, internships, tasks, attendance, evaluations] = await Promise.all([
      this.getProfile(userId),
      this.getInternships(userId),
      this.getTasks(userId),
      this.getAttendance(userId),
      this.getEvaluations(userId),
      this.getActivityFeed(userId),
    ]);

    // Calculate stats
    const stats = {
      totalInternships: internships.length,
      totalTasks: tasks.length,
      totalAttendance: attendance.length,
      totalEvaluations: evaluations.length,
      pendingTasks: tasks.filter(t => t.status === TaskStatus.TODO).length,
      inProgressTasks: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      completedTasks: tasks.filter(t => t.status === TaskStatus.DONE).length,
      todayAttendance: attendance.filter(a => {
        const today = new Date();
        return a.date.getDate() === today.getDate() &&
          a.date.getMonth() === today.getMonth() &&
          a.date.getFullYear() === today.getFullYear();
      }).length,
      averageScore: evaluations.reduce((acc, e) => acc + (e.score || 0), 0) / (evaluations.length || 1),
    };

    return {
      profile,
      internships,
      tasks,
      attendance,
      evaluations,
      stats,
    };
  }



  async getInternshipDetails(userId: number, internshipId: number) {
    // 1. التحقق من أن الطالب مسجل في هذا التدريب
    const enrolled = await this.prisma.internshipStudent.findFirst({
      where: {
        studentId: userId,
        internshipId,
      },
    });

    if (!enrolled) throw new ForbiddenException('You are not enrolled in this internship');

    // 2. جلب تفاصيل التدريب
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        opportunity: true,
        company: true,
        university: true,
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        tasks: {
          include: {
            submissions: {
              where: { studentId: userId },
            },
          },
          orderBy: { deadline: 'asc' },
        },
        attendance: {
          where: { studentId: userId },
          orderBy: { date: 'desc' },
        },
        evaluations: {
          where: { studentId: userId },
          include: {
            evaluator: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!internship) throw new NotFoundException('Internship not found');

    // 3. حساب الإحصائيات
    const totalTasks = internship.tasks.length;
    const completedTasks = internship.tasks.filter(t => t.status === TaskStatus.DONE).length;
    const attendanceCount = internship.attendance.length;
    const presentCount = internship.attendance.filter(a => a.status === AttendanceStatus.CHECKED_IN).length;

    return {
      ...internship,
      stats: {
        totalTasks,
        completedTasks,
        progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        attendanceCount,
        presentCount,
        attendanceRate: attendanceCount > 0 ? (presentCount / attendanceCount) * 100 : 0,
      },
    };
  }

  private sanitizeFileName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\-]/g, '');
  }




  async getActivityFeed(userId: number, limit: number = 10) {

    const tasks = await this.prisma.task.findMany({
      where: {
        internship: {
          students: { some: { studentId: userId } },
        },
      },
      orderBy: { deadline: 'desc' },
      take: limit,
      include: {
        internship: {
          include: {
            opportunity: true,
            company: true,
          },
        },
      },
    });


    // 2. جلب التقييمات الجديدة
    const evaluations = await this.prisma.evaluation.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        score: true,
        feedback: true,
        createdAt: true,
        type: true,
        evaluator: {
          select: { firstName: true, lastName: true, role: true },
        },
      },
    });

    // 3. جلب الحضور
    const attendance = await this.prisma.attendance.findMany({
      where: { studentId: userId },
      orderBy: { date: 'desc' },
      take: limit,
      select: {
        id: true,
        date: true,
        status: true,
        internship: {
          select: {
            opportunity: { select: { title: true } },
          },
        },
      },
    });

    // 4. تجميع النشاطات وترتيبها زمنياً
    const activities = [
      ...tasks.map(t => ({
        type: 'task',
        title: t.title,
        status: t.status,
        time: t.deadline ?? new Date(),
        details: `${t.internship?.opportunity?.title || ''} - ${t.internship?.company?.name || ''}`,
      })),
      ...evaluations.map(e => ({
        type: 'evaluation',
        score: e.score,
        feedback: e.feedback,
        time: e.createdAt,
        details: `by ${e.evaluator?.firstName} ${e.evaluator?.lastName} (${e.type})`,
      })),
      ...attendance.map(a => ({
        type: 'attendance',
        status: a.status,
        time: a.date,
        details: a.internship?.opportunity?.title || '',
      })),
    ];

    // ترتيب حسب التاريخ (الأحدث أولاً)
    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, limit);
  }



  private async ensurePersonalIdNotUsed(personalID: number): Promise<void> {
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




  private generateVerificationFileName(firstName: string, lastName: string): string {
    const safeFirst = this.sanitizeFileName(firstName);
    const safeLast = this.sanitizeFileName(lastName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    //  Shahd_abu_sharif_verification_document_1782458095747_a1b2c3.pdf
    return `${safeFirst}_${safeLast}_verification_document_${timestamp}_${random}`;
  }


  private async ensureStudentNumberNotUsed(studentNumber: number, universityId: number): Promise<void> {
    const existing = await this.prisma.studentProfile.findFirst({
      where: {
        studentNumber,
        universityId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Student number already exists in this university`
      );
    }
  }
}

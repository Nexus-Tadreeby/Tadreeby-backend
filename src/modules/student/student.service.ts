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
import { FilesService, FileType } from '../files/files.service';

@Injectable()
export class StudentService {


  constructor(
    private readonly prisma: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
    private readonly filesService: FilesService,
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
        internships: {
          where: { internship: { status: InternshipStatus.ACTIVE } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            internship: {
              include: {
                trainer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    profileImage: true,
                  },
                },
                opportunity: {
                  select: {
                    id: true,
                    title: true,
                    duration: true,
                    type: true,
                  },
                },
                company: {
                  select: {
                    id: true,
                    name: true,
                    shortCode: true,
                    logo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Student profile not found');
    const currentEnrollment = profile.internships[0];
    const { internships, ...profileData } = profile;
    const transformed = {
      ...profileData,
      university: profile.university?.name || null,
      currentInternship: currentEnrollment
        ? {
          id: currentEnrollment.internship.id,
          title: currentEnrollment.internship.opportunity.title,
          duration: currentEnrollment.internship.opportunity.duration,
          type: currentEnrollment.internship.opportunity.type,
          enrolledAt: currentEnrollment.createdAt,
          trainer: currentEnrollment.internship.trainer,
          company: {
            ...currentEnrollment.internship.company,
            enrolledAt: currentEnrollment.createdAt,
          },
        }
        : null,
    };
    return convertBigIntFields(transformed);
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
        internships: {
          where: { internship: { status: InternshipStatus.ACTIVE } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            internship: {
              include: {
                company: {
                  select: {
                    id: true,
                    name: true,
                    shortCode: true,
                    logo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return convertBigIntFields({
      ...updated,
      company: updated.internships[0]?.internship.company || null,
    });
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
      include: {
        company: true,
        internships: {
          select: { id: true },
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    const internship = opportunity.internships[0];

    if (internship) {
      return this.getInternshipDetails(userId, internship.id, false);
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





  async reuploadDocument(userId: number, file: Express.Multer.File) {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw new ConflictException('Profile not found');

    if (
      profile.approvalStatus !== StudentApprovalStatus.PENDING &&
      profile.approvalStatus !== StudentApprovalStatus.REJECTED
    ) {
      throw new ConflictException('Cannot reupload document unless status is PENDING or REJECTED');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        verificationDocument: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
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
    console.log('🔍 getInternships called with userId:', userId);
    const result = await this.prisma.internshipStudent.findMany({
      where: { studentId: userId },
      include: {
        internship: {
          include: {
            opportunity: true,
            company: true,
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('📦 Found internships:', result.length);
    return result;
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

    const internship = await this.prisma.internship.create({
      data: {
        opportunityId,
        companyId: opportunity.companyId,
        title: opportunity.title,
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



  // async getTasks(userId: number) {
  //   return this.prisma.task.findMany({
  //     where: {
  //       internship: {
  //         students: {
  //           some: {
  //             studentId: userId,
  //           },
  //         },
  //       },
  //     },
  //     include: {
  //       submissions: {
  //         where: { studentId: userId },
  //       },
  //     },
  //     orderBy: { deadline: 'asc' },
  //   });
  // }



  async getTasks(studentId: number) {
    return this.prisma.task.findMany({
      where: {
        internship: {
          students: {
            some: {
              studentId,
            },
          },
        },
      },

      include: {
        internship: true,

        submissions: {
          where: {
            studentId,
          },
        },
      },

      orderBy: [
        {
          deadline: 'asc',
        },
        {
          id: 'desc',
        },
      ],
    });
  }


  async getTask(
    studentId: number,
    taskId: number,
  ) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,

        internship: {
          students: {
            some: {
              studentId,
            },
          },
        },
      },

      include: {
        internship: true,

        submissions: {
          where: {
            studentId,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    return task;
  }


  async getTaskSubmission(
    studentId: number,
    taskId: number,
  ) {
    const task = await this.getTask(
      studentId,
      taskId,
    );

    return task.submissions[0] ?? null;
  }





  private async saveStudentTaskFile(
    studentId: number,
    taskId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    const result = await this.filesService.uploadFile(
      file,
      FileType.TASK,
      studentId,
      'Student',
      `${taskId}`,
    );
    return result.url;
  }


  async submitTask(
    studentId: number,
    taskId: number,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // جلب المهمة مع التسليمات الحالية
    const task = await this.getTask(studentId, taskId);

    // التأكد من عدم وجود تسليم مسبق (تسليم واحد لكل مهمة)
    if (task.submissions.length > 0) {
      throw new BadRequestException('You have already submitted this task');
    }

    // حفظ الملف والحصول على الرابط
    const fileUrl = await this.saveStudentTaskFile(studentId, taskId, file);

    // إنشاء سجل التسليم في قاعدة البيانات
    const submission = await this.prisma.taskSubmission.create({
      data: {
        taskId,
        studentId,
        fileUrl,
        submittedAt: new Date(),
      },
    });

    // إرجاع التسليم مع تحويل BigInt إلى Number
    return convertBigIntFields(submission);
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



  // async checkOut(studentId: number) {
  //   const now = new Date();

  //   // ✅ Set checkout time to 4:00 PM of the current day
  //   const checkoutTime = new Date(now);
  //   checkoutTime.setHours(16, 0, 0, 0); // 4:00 PM

  //   // Find active attendance record
  //   let attendance = await this.prisma.attendance.findFirst({
  //     where: {
  //       studentId,
  //       status: 'CHECKED_IN',
  //     },
  //     orderBy: { date: 'desc' },
  //   });

  //   // If no active record, create a new one (force checkout)
  //   if (!attendance) {
  //     const internshipStudent = await this.prisma.internshipStudent.findFirst({
  //       where: { studentId },
  //       include: { internship: true },
  //     });

  //     if (!internshipStudent) {
  //       throw new NotFoundException('No internship found for this student.');
  //     }

  //     attendance = await this.prisma.attendance.create({
  //       data: {
  //         internshipId: internshipStudent.internshipId,
  //         studentId,
  //         date: new Date(),
  //         checkOut: checkoutTime,
  //         duration: '0h 0m',
  //         status: 'CHECKED_OUT',
  //       },
  //       include: {
  //         internship: {
  //           include: {
  //             opportunity: true,
  //             company: true,
  //           },
  //         },
  //       },
  //     });

  //     return convertBigIntFields(attendance);
  //   }

  //   // Calculate duration
  //   const durationMs = checkoutTime.getTime() - attendance.date.getTime();
  //   const hours = Math.floor(durationMs / (1000 * 60 * 60));
  //   const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  //   const durationStr = `${hours}h ${minutes}m`;

  //   // Update existing record
  //   const updated = await this.prisma.attendance.update({
  //     where: { id: attendance.id },
  //     data: {
  //       checkOut: checkoutTime,
  //       duration: durationStr,
  //       status: 'CHECKED_OUT',
  //     },
  //     include: {
  //       internship: {
  //         include: {
  //           opportunity: true,
  //           company: true,
  //         },
  //       },
  //     },
  //   });

  //   return convertBigIntFields(updated);
  // }



  // src/modules/student/student.service.ts

  async checkOut(studentId: number) {
    const now = new Date();

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        studentId,
        status: 'CHECKED_IN',
      },
      orderBy: { date: 'desc' },
    });

    if (!attendance) {
      throw new NotFoundException('No active check‑in found for today. Please check in first.');
    }

    const durationMs = now.getTime() - attendance.date.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationStr = `${hours}h ${minutes}m`;

    const updated = await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        duration: durationStr,
        status: 'CHECKED_OUT',
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

    return convertBigIntFields(updated);
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




  // async getDashboard(userId: number) {
  //   const [profile, internships, tasks, attendance, evaluations] = await Promise.all([
  //     this.getProfile(userId),
  //     this.getInternships(userId),
  //     this.getTasks(userId),
  //     this.getAttendance(userId),
  //     this.getEvaluations(userId),
  //     this.getActivityFeed(userId),
  //   ]);

  //   // Calculate stats
  //   const stats = {
  //     totalInternships: internships.length,
  //     totalTasks: tasks.length,
  //     totalAttendance: attendance.length,
  //     totalEvaluations: evaluations.length,
  //     pendingTasks: tasks.filter(t => t.status === TaskStatus.TODO).length,
  //     inProgressTasks: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
  //     completedTasks: tasks.filter(t => t.status === TaskStatus.DONE).length,
  //     todayAttendance: attendance.filter(a => {
  //       const today = new Date();
  //       return a.date.getDate() === today.getDate() &&
  //         a.date.getMonth() === today.getMonth() &&
  //         a.date.getFullYear() === today.getFullYear();
  //     }).length,
  //     averageScore: evaluations.reduce((acc, e) => acc + (e.score || 0), 0) / (evaluations.length || 1),
  //   };

  //   return {
  //     profile,
  //     internships,
  //     tasks,
  //     attendance,
  //     evaluations,
  //     stats,
  //   };
  // }


  async getDashboard(userId: number) {
    const [profile, internships, tasks, attendance, evaluations] = await Promise.all([
      this.getProfile(userId),
      this.getInternships(userId),
      this.getTasks(userId),
      this.getAttendance(userId),
      this.getEvaluations(userId),
      this.getActivityFeed(userId),
    ]);

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



  async getInternshipDetails(userId: number, internshipId: number, requireEnrollment = true) {
    if (requireEnrollment) {
      const enrolled = await this.prisma.internshipStudent.findFirst({
        where: {
          studentId: userId,
          internshipId,
        },
      });

      if (!enrolled) {
        throw new ForbiddenException('You are not enrolled in this internship');
      }
    }

    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        company: true,
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        opportunity: true,
        supervisors: {
          include: {
            supervisor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                supervisorProfile: {
                  select: {
                    department: true,
                  },
                },
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
        },
        students: {
          include: {
            student: {
              include: {
                user: {
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
                    shortCode: true,
                  },
                },
              },
            },
          },
        },
        tasks: {
          include: {
            submissions: true,
          },
          orderBy: { deadline: 'asc' },
        },
        attendance: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!internship) {
      throw new NotFoundException('Internship not found');
    }

    const tasks = internship.tasks ?? [];
    const students = internship.students ?? [];
    const attendanceEntries = internship.attendance ?? [];
    const todayAttendance = attendanceEntries.filter((entry) => {
      const date = new Date(entry.date);
      const now = new Date();
      return date.toDateString() === now.toDateString();
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === TaskStatus.DONE).length;
    const inProgressTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length;
    const needsGrading = tasks.reduce((sum, task) => sum + (task.needsReviewCount ?? 0), 0);
    const completedPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const studentAverageAttendanceRate = students.length > 0
      ? Math.round(
        students.reduce((sum, item) => sum + Number(item.attendanceRate ?? 0), 0) / students.length,
      )
      : 0;

    const flagged = students.filter((item) => String(item.status ?? '').toLowerCase() === 'warning').length;

    const academicAllocations = this.buildAcademicAllocations(internship.academicAllocations, students);
    const universitySupervisors = internship.supervisors.map((supervisorItem) => ({
      id: supervisorItem.supervisor.id,
      firstName: supervisorItem.supervisor.firstName,
      lastName: supervisorItem.supervisor.lastName,
      profileImage: supervisorItem.supervisor.profileImage ?? null,
      department: supervisorItem.supervisor.supervisorProfile?.department ?? null,
      role: supervisorItem.role ?? null,
      university: {
        id: supervisorItem.university.id,
        name: supervisorItem.university.name,
        shortCode: supervisorItem.university.shortCode,
      },
    }));

    const studentsPreview = students.slice(0, 10).map((entry) => ({
      id: entry.student.user.id,
      firstName: entry.student.user.firstName,
      lastName: entry.student.user.lastName,
      shortCode: entry.student.university?.shortCode ?? '',
      university: entry.student.university?.shortCode ?? '',
      attendanceRate: Number(entry.attendanceRate ?? 0),
      status: entry.status ?? null,
    }));

    const techStack = this.normalizeJsonStringArray(internship.techStack);
    const competencies = this.normalizeJsonStringArray(internship.competencies);
    const learningObjectives = this.normalizeLearningObjectives(internship.learningObjectives);
    const remoteTools = this.parseRemoteTools(internship.remoteTools);
    const currentActiveAssignment = this.buildCurrentActiveAssignment(tasks, internship.enrolledCount || students.length);

    return {
      id: internship.id,
      status: internship.status,
      header: {
        title: internship.title,
        subtitle: internship.subtitle ?? null,
        cohort: internship.cohort ?? null,
        coverImage: internship.coverImage ?? null,
        trainingType: internship.trainingType,
        location: internship.location ?? null,
        enrolledCount: internship.enrolledCount ?? students.length,
        company: {
          id: internship.company.id,
          name: internship.company.name,
          logo: internship.company.logo ?? null,
        },
        trainer: internship.trainer
          ? {
            id: internship.trainer.id,
            firstName: internship.trainer.firstName,
            lastName: internship.trainer.lastName,
            profileImage: internship.trainer.profileImage ?? null,
          }
          : null,
      },
      stats: {
        internshipProgress: {
          percent: internship.progressPercent ?? 0,
          weeksCompleted: internship.weeksCompleted ?? 0,
          weeksTotal: internship.weeksTotal ?? 0,
          hoursCompleted: internship.hoursTotal && internship.hoursPerWeek && internship.weeksCompleted !== null && internship.weeksCompleted !== undefined
            ? Math.round(internship.hoursPerWeek * internship.weeksCompleted)
            : 0,
          hoursTotal: internship.hoursTotal ?? 0,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          needsGrading,
          completedPercent,
        },
        attendance: {
          ratePercent: studentAverageAttendanceRate,
          presentToday: todayAttendance.length,
          flagged,
        },
      },
      about: {
        description: internship.description ?? null,
        techStack,
        learningObjectives,
        competencies,
      },
      overview: {
        trainingPeriod: {
          startDate: internship.startDate ? internship.startDate.toISOString() : null,
          endDate: internship.endDate ? internship.endDate.toISOString() : null,
          weeksRemaining: Math.max(0, (internship.totalSprints ?? 0) - (internship.currentSprint ?? 0)),
        },
        totalDuration: {
          hours: internship.hoursTotal ?? 0,
          hoursPerWeek: internship.hoursPerWeek ?? null,
          workingDays: internship.workingDays ?? null,
        },
        trainingVenue: {
          name: internship.venueName ?? null,
          address: internship.venueAddress ?? null,
          remoteTools,
        },
        academicAllocations,
        universitySupervisors,
      },
      currentActiveAssignment,
      syllabus: {
        techStack,
        competencies,
      },
      logistics: {
        attendanceModel: {
          type: internship.trainingType === 'ONSITE'
            ? 'On-Site Lab + QR Verification'
            : internship.trainingType === 'REMOTE'
              ? 'Remote Attendance + QR Verification'
              : 'Hybrid Attendance + QR Verification',
          description: 'Daily check-in rules are managed by the internship schedule and attendance policy.',
          minPercentRequired: internship.attendanceMinPercent ?? 90,
          checkInWindow: {
            start: internship.checkInStart ?? null,
            end: internship.checkInEnd ?? null,
          },
        },
        workingSchedule: {
          days: internship.workingDays ?? null,
          hours: internship.workStartTime && internship.workEndTime
            ? `${internship.workStartTime} - ${internship.workEndTime}`
            : null,
          notes: internship.workStartTime && internship.workEndTime
            ? 'Attendance is tracked according to the assigned daily check-in window.'
            : null,
        },
        designatedFacility: {
          name: internship.venueName ?? null,
          description: internship.venueAddress ?? null,
          equipment: internship.venueEquipment ?? null,
        },
        partners: {
          count: academicAllocations.length,
          list: academicAllocations.map((allocation) => ({
            university: allocation.university,
            shortCode: allocation.shortCode,
            count: allocation.count,
          })),
        },
      },
      studentsPreview,
      createdAt: internship.createdAt.toISOString(),
      updatedAt: internship.updatedAt.toISOString(),
    };
  }

  private buildCurrentActiveAssignment(tasks: any[], totalStudents: number) {
    const inProgressTasks = tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS);
    const chosen = [...inProgressTasks].sort((a, b) => (b.needsReviewCount ?? 0) - (a.needsReviewCount ?? 0))[0];

    if (!chosen) {
      return null;
    }

    const submissionsReceived = Number(chosen.submissionCount ?? chosen.submissions?.length ?? 0);
    const recentSubmissionsLast40Min = (chosen.submissions ?? []).filter((submission: any) => {
      if (!submission?.submittedAt) return false;
      const submittedAt = new Date(submission.submittedAt);
      const diffInMinutes = (Date.now() - submittedAt.getTime()) / (1000 * 60);
      return diffInMinutes <= 40;
    }).length;

    return {
      taskId: chosen.id,
      title: chosen.title,
      badge: chosen.badge ?? 'IN REVIEW',
      needsReview: chosen.needsReviewCount ?? 0,
      deadline: chosen.deadline ? chosen.deadline.toISOString() : null,
      submissionsReceived,
      totalStudents,
      submittedPercent: totalStudents > 0 ? Math.round((submissionsReceived / totalStudents) * 100) : 0,
      recentSubmissionsLast40Min,
      rubricUrl: chosen.rubricUrl ?? null,
    };
  }

  private buildAcademicAllocations(rawAllocations: unknown, students: any[]) {
    if (Array.isArray(rawAllocations) && rawAllocations.length > 0) {
      return rawAllocations
        .filter((item) => typeof item === 'object' && item !== null)
        .map((item: any) => ({
          university: item.university ?? '',
          shortCode: item.shortCode ?? '',
          count: Number(item.count ?? 0),
        }))
        .filter((item) => item.university || item.shortCode);
    }

    const grouped = new Map<string, { university: string; shortCode: string; count: number }>();

    for (const student of students) {
      const universityName = student.student?.university?.name ?? 'Unknown';
      const universityShortCode = student.student?.university?.shortCode ?? 'N/A';
      const key = universityShortCode || universityName;

      if (!grouped.has(key)) {
        grouped.set(key, {
          university: universityName,
          shortCode: universityShortCode,
          count: 0,
        });
      }

      grouped.get(key)!.count += 1;
    }

    return [...grouped.values()].sort((a, b) => b.count - a.count);
  }

  private normalizeJsonStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (typeof entry === 'number' || typeof entry === 'boolean') return String(entry);
        if (typeof entry === 'object' && entry !== null) {
          const obj = entry as Record<string, any>;
          return obj.name ?? obj.title ?? obj.value ?? '';
        }
        return '';
      })
      .filter((entry) => entry && entry.length > 0);
  }

  private normalizeLearningObjectives(value: unknown): Array<{ title: string; description: string | null }> {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) => {
        if (typeof entry === 'object' && entry !== null) {
          const obj = entry as Record<string, any>;
          return {
            title: String(obj.title ?? ''),
            description: obj.description != null ? String(obj.description) : null,
          };
        }

        return {
          title: String(entry ?? ''),
          description: null,
        };
      })
      .filter((entry) => entry.title && entry.title.length > 0);
  }

  private parseRemoteTools(value: string | null | undefined): string[] {
    if (!value) return [];
    return value
      .split(/[;,\n]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
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

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
    const [opportunity, studentProfile, existingApplication] = await Promise.all([
      this.prisma.trainingOpportunity.findUnique({
        where: { id: opportunityId, isActive: true },
        include: {
          company: true,
          trainer: {
            include: {
              trainerProfile: true,
            },
          },
          applications: {
            where: { studentId: userId },
            select: { id: true, status: true },
            take: 1,
            orderBy: { appliedAt: 'desc' },
          },
          internships: {
            select: { id: true },
          },
        },
      }),
      this.prisma.studentProfile.findUnique({
        where: { userId },
        select: { approvalStatus: true, skills: true, major: true, cvUrl: true },
      }),
      this.prisma.application.findFirst({
        where: { studentId: userId, opportunityId },
        select: { id: true, status: true },
      }),
    ]);

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    const cvText = await this.extractCvText(studentProfile?.cvUrl ?? null);
    return this.mapOpportunity(opportunity, studentProfile, existingApplication, cvText);
  }

  private async mapOpportunity(opportunity: any, studentProfile?: { approvalStatus?: string; skills?: string | null; major?: string | null; cvUrl?: string | null } | null, existingApplication?: { id: number; status: string } | null, cvText?: string) {
    const requiredSkills = this.parseSkillList(opportunity.requiredSkills);
    const studentSkills = this.parseSkillList(studentProfile?.skills ?? '');
    const matchedSkills = requiredSkills.filter((skill) =>
      studentSkills.some((studentSkill) => this.normalizeSkill(studentSkill) === this.normalizeSkill(skill)),
    );
    const majorMatch = this.isMajorRelevantToOpportunity(studentProfile?.major, opportunity.trainingField);
    const cvMatchPercent = this.calculateCvTextMatch(requiredSkills, cvText ?? '', studentProfile?.major ?? null, opportunity.trainingField ?? null);
    const profileMatch = this.calculateProfileMatch(requiredSkills, matchedSkills.length, majorMatch, cvMatchPercent);

    const durationMonths = this.parseDurationMonths(opportunity.duration);
    const daysUntilDeadline = opportunity.applicationDeadline
      ? Math.max(0, Math.ceil((new Date(opportunity.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    const trainingType = opportunity.type === 'REMOTE'
      ? 'REMOTE'
      : opportunity.type === 'HYBRID'
        ? 'HYBRID'
        : 'ONSITE';

    const workingSchedule = {
      days: opportunity.workDays ?? null,
      startTime: opportunity.workStartTime ?? null,
      endTime: opportunity.workEndTime ?? null,
      dailyHours: opportunity.dailyHours ?? null,
      notes: opportunity.meetingLink ?? null,
    };

    const companyStats = {
      internsTrained: opportunity.company?.internsTrained ?? 0,
      completionRate: opportunity.company?.completionRate ?? 0,
      universityPartners: opportunity.company?.universityPartners ?? 0,
      avgStudentRating: opportunity.company?.avgStudentRating ?? 0,
    };

    return {
      id: opportunity.id,
      status: opportunity.status,
      isActive: opportunity.isActive,
      header: {
        title: opportunity.title,
        // subtitle: trainingType,
        trainingType: trainingType,
        cohort: opportunity.cohort ?? null,
        coverImage: opportunity.coverImage ?? null,
        location: opportunity.location ?? null,
        company: {
          name: opportunity.company?.name ?? null,
          logo: opportunity.company?.logo ?? null,
          verifiedByTadreeby: opportunity.company?.verifiedByTadreeby ?? false,
        },
        mentor: opportunity.trainer
          ? {
            id: opportunity.trainer.id,
            firstName: opportunity.trainer.firstName,
            lastName: opportunity.trainer.lastName,
            position: opportunity.trainer.trainerProfile?.position ?? null,
            bio: opportunity.trainer.trainerProfile?.bio ?? null,
            yearsExperience: opportunity.trainer.trainerProfile?.yearsExperience ?? null,
            profileImage: opportunity.trainer.profileImage ?? null,
          }
          : null,
      },
      stats: {
        seats: {
          total: opportunity.totalSeats ?? 0,
          available: Math.max(0, (opportunity.totalSeats ?? 0) - (opportunity.internships?.length ?? 0)),
        },
        duration: {
          months: durationMonths,
          hours: opportunity.hoursTotal ?? 0,
          hoursPerWeek: opportunity.hoursPerWeek ?? 0,
        },
        stipend: opportunity.stipend ?? 0,
        applicationDeadline: opportunity.applicationDeadline ?? null,
        daysUntilDeadline: daysUntilDeadline,
      },
      about: {
        description: opportunity.description ?? null,
        techStack: Array.isArray(opportunity.techStack) ? opportunity.techStack : [],
        learningObjectives: Array.isArray(opportunity.learningObjectives) ? opportunity.learningObjectives : [],
        competencies: Array.isArray(opportunity.competencies) ? opportunity.competencies : [],
      },
      overview: {
        trainingPeriod: {
          startDate: opportunity.startDate ?? null,
          endDate: opportunity.endDate ?? null,
        },
        totalDuration: {
          hours: opportunity.hoursTotal ?? 0,
          hoursPerWeek: opportunity.hoursPerWeek ?? 0,
          workingDays: opportunity.workDays ?? null,
          durationLabel: opportunity.duration ?? null,
        },
        trainingVenue: {
          name: opportunity.venueName ?? null,
          address: opportunity.venueAddress ?? null,
          latitude: opportunity.latitude ?? null,
          longitude: opportunity.longitude ?? null,
          equipment: opportunity.venueEquipment ?? null,
          remoteTools: opportunity.remoteTools ?? null,
        },
        engineeringField: opportunity.trainingField ?? null,
      },
      logistics: {
        attendanceModel: {
          type: this.formatAttendanceType(opportunity.type),
          checkInStart: opportunity.checkInStart ?? null,
          checkInEnd: opportunity.checkInEnd ?? null,
          minPercent: opportunity.attendanceMinPercent ?? 0,
        },
        workingSchedule,
      },
      curriculum: Array.isArray(opportunity.curriculum) ? opportunity.curriculum : [],
      responsibilities: Array.isArray(opportunity.responsibilities) ? opportunity.responsibilities : [],
      qualifications: {
        academic: Array.isArray((opportunity.qualifications as any)?.academic) ? (opportunity.qualifications as any).academic : [],
        technical: Array.isArray((opportunity.qualifications as any)?.technical) ? (opportunity.qualifications as any).technical : [],
      },
      // benefits: Array.isArray(opportunity.benefits) ? opportunity.benefits : [],
      certificateInfo: opportunity.certificateInfo ?? null,
      companyStats,
      application: {
        isEligible: Boolean(studentProfile),
        profileMatch,
        alreadyApplied: Boolean(existingApplication),
        status: existingApplication?.status ?? null,
      },
    };
  }

  private calculateProfileMatch(requiredSkills: string[], matchedSkillCount: number, majorMatch: boolean, cvMatchPercent: number): number {
    if (requiredSkills.length === 0) return 100;

    const skillMatchPercent = Math.round((matchedSkillCount / requiredSkills.length) * 100);
    const majorBonus = majorMatch ? 20 : 0;
    const weightedScore = (skillMatchPercent * 0.7) + (cvMatchPercent * 0.25) + majorBonus;

    return Math.min(100, Math.round(weightedScore));
  }

  private calculateCvTextMatch(requiredSkills: string[], cvText: string, studentMajor?: string | null, opportunityField?: string | null): number {
    if (!cvText || requiredSkills.length === 0) {
      return 0;
    }

    const normalizedText = this.normalizeCvText(cvText);
    const relevantSkillMatches = requiredSkills.filter((skill) => {
      const normalizedSkill = this.normalizeCvText(skill);
      return normalizedSkill && normalizedText.includes(normalizedSkill);
    });

    const skillCoverage = (relevantSkillMatches.length / requiredSkills.length) * 100;
    const majorBonus = this.isMajorRelevantToOpportunity(studentMajor, opportunityField) ? 20 : 0;

    return Math.min(100, Math.round(skillCoverage + majorBonus));
  }

  private normalizeCvText(value: string): string {
    return value
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[^a-z0-9\s+.#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async extractCvText(cvUrl?: string | null): Promise<string> {
    if (!cvUrl || !cvUrl.startsWith('data:')) {
      return '';
    }

    try {
      const match = cvUrl.match(/^data:(.*?);base64,(.*)$/i);
      if (!match) {
        return '';
      }

      const mimeType = match[1]?.toLowerCase() ?? '';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      if (mimeType.includes('pdf')) {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const pdf = await pdfjs.getDocument({ data: buffer }).promise;
        const pages: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ');
          pages.push(pageText);
        }

        return pages.join(' ');
      }

      if (mimeType.includes('word') || mimeType.includes('officedocument') || mimeType.includes('document')) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value ?? '';
      }

      return buffer.toString('utf8');
    } catch (error) {
      return '';
    }
  }

  private isMajorRelevantToOpportunity(studentMajor?: string | null, opportunityField?: string | null): boolean {
    if (!studentMajor || !opportunityField) return false;

    const normalize = (value: string) => value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const major = normalize(studentMajor);
    const field = normalize(opportunityField);

    if (!major || !field) return false;
    if (major === field) return true;
    if (major.includes(field) || field.includes(major)) return true;

    const majorWords = new Set(major.split(' ').filter(Boolean));
    const fieldWords = new Set(field.split(' ').filter(Boolean));
    const overlap = [...majorWords].filter((word) => fieldWords.has(word));

    return overlap.length > 0;
  }

  private parseSkillList(value: string | null | undefined): string[] {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private parseDurationMonths(value: string | null | undefined): number | null {
    if (!value) return null;

    const match = String(value).match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;

    return Number(match[1]);
  }

  private formatAttendanceType(type: string | null | undefined): string {
    if (!type) return 'On-Site Lab + QR Verification';

    if (type === 'REMOTE') return 'Remote';
    if (type === 'HYBRID') return 'On-Site Lab + QR Verification';
    return 'On-Site Lab + QR Verification';
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
      include: {
        internship: {
          select: {
            opportunity: {
              select: { hoursTotal: true },
            },
          },
        },
      },
    });

    if (!enrolled) throw new ForbiddenException('You are not enrolled in this internship');

    const maxTrainingHours = enrolled.internship.opportunity.hoursTotal ?? 0;
    if (maxTrainingHours > 0) {
      const completedAttendance = await this.prisma.attendance.findMany({
        where: {
          studentId: userId,
          internshipId,
          checkOut: { not: null },
        },
        select: { duration: true },
      });

      const completedMinutes = completedAttendance.reduce((total, record) => {
        const duration = record.duration ?? '';
        const hours = Number(duration.match(/([\d.]+)\s*h/i)?.[1] ?? 0);
        const minutes = Number(duration.match(/([\d.]+)\s*m/i)?.[1] ?? 0);
        return total + hours * 60 + minutes;
      }, 0);

      if (completedMinutes >= maxTrainingHours * 60) {
        throw new ForbiddenException('You have completed the maximum training hours for this internship');
      }
    }

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



  async getInternshipDetails(userId: number, internshipId: number) {
    const [enrolled, internship] = await Promise.all([
      this.prisma.internshipStudent.findFirst({ where: { studentId: userId, internshipId } }),
      this.prisma.internship.findUnique({
        where: { id: internshipId },
        select: {
          id: true,
          status: true,
          cohort: true,
          progressPercent: true,
          currentMilestone: true,
          totalMilestones: true,
          weeksCompleted: true,
          weeksTotal: true,
          startDate: true,
          endDate: true,
          opportunity: {
            select: {
              title: true,
              description: true,
              coverImage: true,
              type: true,
              location: true,
              hoursTotal: true,
              hoursPerWeek: true,
              workDays: true,
              dailyHours: true,
              workStartTime: true,
              workEndTime: true,
              attendanceMinPercent: true,
              checkInStart: true,
              checkInEnd: true,
              venueName: true,
              venueAddress: true,
              venueEquipment: true,
              remoteTools: true,
              latitude: true,
              longitude: true,
              techStack: true,
              learningObjectives: true,
              competencies: true,
            },
          },
          company: { select: { name: true, logo: true } },
          trainer: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    if (!enrolled) throw new ForbiddenException('You are not enrolled in this internship');
    if (!internship) throw new NotFoundException('Internship not found');

    const [supervisors, academicStudents, tasks, attendance, evaluations, aiEvaluation] = await Promise.all([
      this.prisma.internshipSupervisor.findMany({
        where: { internshipId },
        select: {
          role: true,
          supervisor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              supervisorProfile: { select: { department: true } },
            },
          },
          university: { select: { name: true, shortCode: true } },
        },
      }),
      this.prisma.internshipStudent.findMany({
        where: { internshipId },
        select: { student: { select: { university: { select: { id: true, name: true, shortCode: true } } } } },
      }),
      this.prisma.task.findMany({
        where: { internshipId },
        select: {
          id: true,
          title: true,
          description: true,
          deadline: true,
          status: true,
          badge: true,
          rubricUrl: true,
          rubric: true,
          submissions: {
            where: { studentId: userId },
            include: { aiEvaluations: { orderBy: { createdAt: 'desc' }, take: 1 } },
          },
        },
        orderBy: { deadline: 'asc' },
      }),
      this.prisma.attendance.findMany({
        where: { internshipId, studentId: userId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.evaluation.findMany({
        where: { studentId: userId, internshipId },
        orderBy: { createdAt: 'desc' },
        include: {
          evaluator: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      }),
      this.prisma.aIEvaluation.findFirst({
        where: { taskSubmission: { studentId: userId, task: { internshipId } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
    const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const attendanceCount = attendance.length;
    const presentCount = attendance.filter(entry =>
      entry.status === AttendanceStatus.CHECKED_IN ||
      entry.status === AttendanceStatus.CHECKED_OUT ||
      entry.status === AttendanceStatus.MARKED_PRESENT,
    ).length;
    const absentCount = attendance.filter(entry => entry.status === AttendanceStatus.MARKED_ABSENT).length;
    const hoursCompleted = attendance.reduce((sum, entry) => {
      const match = entry.duration?.match(/[\d.]+/);
      return sum + (match ? Number(match[0]) : 0);
    }, 0);
    const hoursTotal = internship.opportunity.hoursTotal ?? 0;
    const currentTask = tasks[0];
    const academicPartners = new Map<number, { university: string; shortCode: string; studentCount: number }>();

    for (const entry of academicStudents) {
      const university = entry.student.university;
      const partner = academicPartners.get(university.id);
      if (partner) partner.studentCount += 1;
      else academicPartners.set(university.id, { university: university.name, shortCode: university.shortCode, studentCount: 1 });
    }

    return {
      id: internship.id,
      status: internship.status,
      header: {
        title: internship.opportunity.title,
        // subtitle: internship.opportunity.shortPitch,
        cohort: internship.cohort,
        coverImage: internship.opportunity.coverImage,
        trainingType: internship.opportunity.type,
        location: internship.opportunity.location,
        company: {
          name: internship.company.name,
          logo: internship.company.logo,
        },
        trainer: internship.trainer
          ? {
            firstName: internship.trainer.firstName,
            lastName: internship.trainer.lastName,
          }
          : null,
      },
      stats: {
        progress: {
          percent: hoursTotal > 0
            ? Math.min(100, Math.round((hoursCompleted / hoursTotal) * 100))
            : internship.progressPercent,
          currentMilestone: internship.currentMilestone ?? 0,
          totalMilestones: internship.totalMilestones ?? 0,
          weeksCompleted: internship.weeksCompleted ?? 0,
          weeksTotal: internship.weeksTotal ?? 0,
          hoursCompleted,
          hoursTotal: internship.opportunity.hoursTotal ?? 0,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
        },
        attendance: {
          ratePercent: attendanceCount > 0 ? Number(((presentCount / attendanceCount) * 100).toFixed(2)) : 0,
          presentRecords: presentCount,
          absentRecords: absentCount,
          totalRecords: attendanceCount,
        },
      },
      about: {
        description: internship.opportunity.description,
        techStack: Array.isArray(internship.opportunity.techStack) ? internship.opportunity.techStack : [],
        learningObjectives: internship.opportunity.learningObjectives ?? [],
        competencies: Array.isArray(internship.opportunity.competencies) ? internship.opportunity.competencies : [],
      },
      overview: {
        trainingPeriod: {
          startDate: internship.startDate,
          endDate: internship.endDate,
          weeksRemaining: Math.max(
            0,
            (internship.weeksTotal ?? 0) - (internship.weeksCompleted ?? 0),
          ),
        },
        totalDuration: {
          hours: internship.opportunity.hoursTotal,
          hoursPerWeek: internship.opportunity.hoursPerWeek,
          workingDays: internship.opportunity.workDays,
        },
        trainingVenue: {
          name: internship.opportunity.venueName,
          address: internship.opportunity.venueAddress,
          latitude: internship.opportunity.latitude,
          longitude: internship.opportunity.longitude,
          equipment: internship.opportunity.venueEquipment,
        },
        academicPartners: Array.from(academicPartners.values()),
      },
      currentTask: currentTask
        ? {
          id: currentTask.id,
          title: currentTask.title,
          description: currentTask.description,
          status: currentTask.status,
          badge: currentTask.badge,
          deadline: currentTask.deadline,
          rubricUrl: currentTask.rubricUrl,
          rubric: currentTask.rubric ?? [],
          submission: currentTask.submissions[0] ?? null,
        }
        : null,
      tasks,
      attendance,
      evaluations,
      lastTaskEvaluation: evaluations[0]
        ? {
          id: evaluations[0].id,
          evaluatorId: evaluations[0].evaluatorId,
          score: evaluations[0].score,
          feedback: evaluations[0].feedback,
          breakdown: evaluations[0].breakdown ?? [],
          evaluator: evaluations[0].evaluator,
          createdAt: evaluations[0].createdAt,
        }
        : null,
      aiEvaluation,
      supervisors: supervisors.map(({ role, supervisor, university }) => ({
        id: supervisor.id,
        firstName: supervisor.firstName,
        lastName: supervisor.lastName,
        department: supervisor.supervisorProfile?.department,
        university: university.name,
        shortCode: university.shortCode,
        role: role ?? supervisor.role,
      })),
      logistics: {
        attendanceModel: {
          type: internship.opportunity.type === 'REMOTE' ? 'Remote' : 'On-Site Lab + QR Verification',
          checkInStart: internship.opportunity.checkInStart,
          checkInEnd: internship.opportunity.checkInEnd,
          minPercent: internship.opportunity.attendanceMinPercent,
        },
        workingSchedule: {
          days: internship.opportunity.workDays,
          startTime: internship.opportunity.workStartTime,
          endTime: internship.opportunity.workEndTime,
          dailyHours: internship.opportunity.dailyHours,
        },
        venue: {
          name: internship.opportunity.venueName,
          address: internship.opportunity.venueAddress,
          latitude: internship.opportunity.latitude,
          longitude: internship.opportunity.longitude,
          equipment: internship.opportunity.venueEquipment,
          remoteTools: internship.opportunity.remoteTools,
        },
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

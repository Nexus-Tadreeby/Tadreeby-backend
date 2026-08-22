import {
    Body,
    Controller,
    Post,
    UseGuards,
    BadRequestException,
    HttpCode,
    HttpStatus,
    Req,
    Get,
    Param,
    Delete,
    UseInterceptors,
    UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

import express from "express";

import { AuthService } from "./auth.service";
import { generateFileName, FileTypeLabel } from "../../common/utils/file-naming.util";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { studentRegisterSchema, type studentRegisterSchemaDto } from "../student/validation/student.register.validation.schema";
import { loginSchema, type LoginSchemaDto } from "./validation/login.validation.schema";
import { logoutSchema, type LogoutSchemaDto } from "./validation/logout.validation.schema";
import { refreshTokenSchema, type RefreshTokenSchemaDto } from "./validation/refresh.validation.schema";

import { ZodValidationPipe } from "../../common/pipes/zod.pipe";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { IsPublic } from "../../common/decorators/isPublic.decorator";

import { AuthedUser } from "../../common/decorators/authedUser.decorator";
import { type authedUserType } from "../../common/types/unifiedType.types";

import { LoginRequestDto, LoginResponseDto } from "./dto/login.dto";
import { LogoutResponseDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { VerifyResetCodeDto } from "./dto/verify-reset-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ForgetPasswordService } from "./forget-password.service";
import { reset_password } from "./validation/reset-password.validation";
import { multerConfig } from "../../common/config/multer.config";
import { FileValidationInterceptor } from "../../common/interceptors/file-validation.interceptor";


@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly forgotPasswordService: ForgetPasswordService,

    ) { }


    @IsPublic()
    @Post('register/student')
    @ApiOperation({ summary: 'Student registration with verification document upload' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['email', 'firstName', 'lastName', 'personalID', 'password', 'confirmPassword', 'universityId', 'studentNumber', 'verificationDocument'],
            properties: {
                email: { type: 'string', example: 'student@university.edu' },
                firstName: { type: 'string', example: 'Shahd' },
                lastName: { type: 'string', example: 'abu sharif' },
                personalID: { type: 'number', example: 123456789 },
                phone: { type: 'string', example: '0592246851' },
                password: { type: 'string', example: 'S3cure@Tadreeby2026' },
                confirmPassword: { type: 'string', example: 'S3cure@Tadreeby2026' },
                universityId: { type: 'number', example: 1 },
                studentNumber: { type: 'number', example: 20200970 },
                major: { type: 'string', example: 'Software Engineering' },
                verificationDocument: {
                    type: 'string',
                    format: 'binary',
                    description: 'Proof of university enrollment (PDF, JPG, PNG) - Maximum size 10 MB',
                },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Student registered successfully' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @UseInterceptors(
        FileInterceptor('verificationDocument', multerConfig),
        FileValidationInterceptor,
    )
    async register(
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: express.Request,
    ) {
        if (!file) {
            throw new BadRequestException('Verification document is required');
        }

        // Generate new filename with student name + file type
        const newFilename = generateFileName(
            body.firstName,
            body.lastName,
            FileTypeLabel.VERIFICATION,
            file.originalname,
        );

        // Rename the uploaded file
        const uploadDir = process.env.UPLOAD_PATH || './uploads/pending';
        const oldPath = path.join(uploadDir, file.filename);
        const newPath = path.join(uploadDir, newFilename);
        fs.renameSync(oldPath, newPath);

        const dtoData = {
            ...body,
            verificationDocument: newFilename,
        };

        const validatedDto = studentRegisterSchema.parse(dtoData);
        const { confirmPassword, ...cleanDto } = validatedDto;

        return this.authService.registerStudent(cleanDto, req);
    }


    @IsPublic()
    @Post('check-email')
    async checkEmail(@Body() body: { email: string }) {
        return this.authService.checkEmailAvailability(body.email);
    }

    @IsPublic()
    @Post('check-national-id')
    async checkNationalId(@Body() body: { personalID: number }) {
        return this.authService.checkNationalIdAvailability(Number(body.personalID));
    }

    @IsPublic()
    @Post('check-student-number')
    async checkStudentNumber(@Body() body: { studentNumber: number; universityId: number }) {
        return this.authService.checkStudentNumberAvailability(
            Number(body.studentNumber),
            Number(body.universityId),
        );
    }

    // @IsPublic()
    // @Post("register/student")
    // @ApiOperation({ summary: 'Student registration with document upload' })
    // @ApiConsumes('multipart/form-data')
    // @ApiBody({
    //     schema: {
    //         type: 'object',
    //         properties: {
    //             email: { type: 'string', example: 'student@university.edu' },
    //             firstName: { type: 'string', example: 'Shahd' },
    //             lastName: { type: 'string', example: 'abu sharif' },
    //             personalID: { type: 'string', example: '123456789' },
    //             phone: { type: 'string', example: '0592246851' },
    //             password: { type: 'string', example: 'S3cure@Tadreeby2026' },
    //             universityId: { type: 'number', example: 1 },
    //             studentNumber: { type: 'string', example: '20200970' },
    //             major: { type: 'string', example: 'Software Engineering' },
    //             verificationDocument: {
    //                 type: 'string',
    //                 format: 'binary',
    //                 description: 'Proof of university enrollment (PDF, JPG, PNG) - Maximum size 10 MB',
    //             },
    //         },
    //     },
    // })
    // @ApiResponse({
    //     status: 201,
    //     description: 'Student registered successfully, awaiting approval'
    // })
    // @ApiResponse({
    //     status: 400,
    //     description: 'Data error or file size exceeds 10 MB limit'
    // })
    // @UseInterceptors(
    //     FileInterceptor('verificationDocument', multerConfig),
    //     FileValidationInterceptor,
    // )
    // async register(
    //     @Body() body: any,  
    //     @UploadedFile() file: Express.Multer.File, 
    //     @Req() req: express.Request,
    // ) {

    //     if (!file) {
    //         throw new BadRequestException('Verification document is required');
    //     }


    //     const dtoData = {
    //         ...body,
    //         verificationDocument: file.filename,  
    //     };

    //     const validatedDto = studentRegisterSchema.parse(dtoData);


    //     return this.authService.registerStudent(validatedDto, req);
    // }

    // @IsPublic()
    // @Post("register/student")
    // @ApiOperation({ summary: 'Student registration with document upload' })
    // @ApiConsumes('multipart/form-data')
    // @ApiBody({
    //     schema: {
    //         type: 'object',
    //         properties: {
    //             email: { type: 'string', example: 'student@university.edu' },
    //             firstName: { type: 'string', example: 'Shahd' },
    //             lastName: { type: 'string', example: 'abu sharif'},
    //             personalID: { type: 'string', example: '123456789' },
    //             phone: { type: 'string', example: '0592246851' },
    //             password: { type: 'string', example: 'S3cure@Tadreeby2026' },
    //             universityId: { type: 'number', example: 1 },
    //             studentNumber: { type: 'string', example: '20200970' },
    //             major: { type: 'string', example: 'Software Engineering' },
    //             verificationDocument: {
    //                 type: 'string',
    //                 format: 'binary',
    //                 description: 'Proof of university enrollment (PDF, JPG, PNG) - Maximum size 10 MB',
    //             },
    //         },
    //     },
    // })
    // @ApiResponse({
    //     status: 201,
    //     description: 'Student registered successfully, awaiting approval'
    // })
    // @ApiResponse({
    //     status: 400,
    //     description: 'Data error or file size exceeds 10 MB limit'
    // })
    // @UseInterceptors(
    //     FileInterceptor('verificationDocument', multerConfig),
    //     FileValidationInterceptor,
    // )
    // register(
    //     @Body(new ZodValidationPipe(studentRegisterSchema))
    //     dto: studentRegisterSchemaDto,

    //     @Req() req: express.Request,
    // ) {
    //     return this.authService.registerStudent(dto, req);
    // }




    @IsPublic()
    @Post("login")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Login" })
    @ApiBody({ type: LoginRequestDto })
    @ApiResponse({ status: 200, type: LoginResponseDto })
    login(
        @Body(new ZodValidationPipe(loginSchema))
        dto: LoginSchemaDto,

        @Req() req: express.Request,
    ) {
        return this.authService.login(dto, req);
    }

    @IsPublic()
    @Post("refresh")
    @ApiOperation({ summary: "Refresh tokens (session rotation)" })
    @ApiBody({ type: RefreshTokenDto })
    @ApiResponse({ status: 200 })
    refresh(
        @Body(new ZodValidationPipe(refreshTokenSchema))
        dto: RefreshTokenSchemaDto,
    ) {
        return this.authService.refresh(dto);
    }


    @IsPublic()
    @Post("forgot-password")
    forgotPassword(
        @Body() dto: ForgotPasswordDto,
    ) {
        return this.forgotPasswordService.forgotPassword(dto);
    }

    @IsPublic()
    @Post("verify-reset-code")
    verifyResetCode(
        @Body() dto: VerifyResetCodeDto,
    ) {
        return this.forgotPasswordService.verifyResetCode(dto);
    }

    @IsPublic()
    @Post("reset-password")
    resetPassword(
        @Body(new ZodValidationPipe(reset_password)) dto: ResetPasswordDto,
    ) {
        return this.forgotPasswordService.resetPassword(dto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post("logout")
    @ApiOperation({ summary: "Logout (invalidate session)" })
    @ApiResponse({ status: 200, type: LogoutResponseDto })
    async logout(
        @AuthedUser() user: authedUserType,
        // @Body(new ZodValidationPipe(logoutSchema))
        // dto: LogoutSchemaDto,
    ) {
        return await this.authService.logout(user.id, user.sid);
    }


    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('sessions')
    getSessions(@Req() req) {
        return this.authService.getSessions(req.user.sub);
    }


    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete('sessions/revoke-all')
    revokeAll(@Req() req) {
        console.log('HIT CONTROLLER');
        return this.authService.revokeAllSessions(req.user.sub);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete('sessions/:id')
    revokeSession(@Req() req, @Param('id') id: string) {
        return this.authService.revokeSession(req.user.sub, id);
    }

}
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
} from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';


import express from "express";

import { AuthService } from "./auth.service";
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
    @Post("register/student")
    @ApiOperation({ summary: 'Student registration with document upload' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'student@university.edu' },
                firstName: { type: 'string', example: 'Shahd' },
                lastName: { type: 'string', example: 'abu sharif'},
                personalID: { type: 'string', example: '123456789' },
                phone: { type: 'string', example: '0592246851' },
                password: { type: 'string', example: 'S3cure@Tadreeby2026' },
                universityId: { type: 'number', example: 1 },
                studentNumber: { type: 'string', example: '20200970' },
                major: { type: 'string', example: 'Software Engineering' },
                verificationDocument: {
                    type: 'string',
                    format: 'binary',
                    description: 'Proof of university enrollment (PDF, JPG, PNG) - Maximum size 10 MB',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Student registered successfully, awaiting approval'
    })
    @ApiResponse({
        status: 400,
        description: 'Data error or file size exceeds 10 MB limit'
    })
    @UseInterceptors(
        FileInterceptor('verificationDocument', multerConfig),
        FileValidationInterceptor,
    )
    register(
        @Body(new ZodValidationPipe(studentRegisterSchema))
        dto: studentRegisterSchemaDto,

        @Req() req: express.Request,
    ) {
        return this.authService.registerStudent(dto, req);
    }




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
    logout(
        @AuthedUser() user: authedUserType,
        @Body(new ZodValidationPipe(logoutSchema))
        dto: LogoutSchemaDto,
    ) {
        return this.authService.logout(dto);
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
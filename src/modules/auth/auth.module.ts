import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { StudentModule } from '../student/student.module';
import { EmailModule } from '../mail/email.module';
import { NotificationModule } from '../notification/notification.module';
import { ForgetPasswordService } from './forget-password.service';

@Module({
  imports: [
    DatabaseModule,
    StudentModule,
    EmailModule,
    NotificationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ForgetPasswordService],
})
export class AuthModule { }
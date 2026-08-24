import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { DatabaseModule } from 'src/database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [DatabaseModule , 
      JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              secret: configService.get<string>('JWT_SECRET'),
              signOptions: { expiresIn: '15min' },
            }),
          }),
    ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule { }

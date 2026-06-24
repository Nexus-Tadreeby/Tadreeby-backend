import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  const defaultAllowed = [
    'http://localhost:4173',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://tadreeby.vercel.app',
  ];

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : defaultAllowed;
  const allowAll = process.env.ALLOW_ALL_ORIGINS === 'true';

  app.enableCors({
    origin: allowAll
      ? true
      : (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
  });

  const config = new DocumentBuilder()
    .setTitle('Tadreeby API')
    .setDescription('Tadreeby API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  console.log("DB URL:", process.env.DATABASE_URL);


  const port = process.env.PORT || 6060;
  await app.listen(port);

  console.log(`Swagger API on http://localhost:${port}/api`);

  // console.log(`Server running on http://localhost:${port}/api`);
  // console.log(`Swagger at http://localhost:${port}/docs`);
}
bootstrap();

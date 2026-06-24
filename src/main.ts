import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173/',
      'https://tadreeby.vercel.app/',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });


  app.enableCors({
    origin: [
      'http://localhost:4173',
      'http://localhost:3000',
      'http://localhost:5173',
      'https://tadreeby.vercel.app',
      
    ],
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

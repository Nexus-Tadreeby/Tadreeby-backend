import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.setGlobalPrefix('api');

  

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

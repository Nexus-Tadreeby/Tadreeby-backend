import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
// import { PrismaNeon } from '@prisma/adapter-neon';
// import { neonConfig } from '@neondatabase/serverless';
import { PrismaPg } from '@prisma/adapter-pg';
// import ws from 'ws';

// neonConfig.webSocketConstructor = ws;

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

    constructor() {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL is required for Prisma Neon adapter');
        }

        // const adapter = new PrismaNeon({ connectionString });
        const adapter = new PrismaPg({ connectionString });
        super({
            adapter,
            log: ['error', 'warn'],
        });
    }

    

    async onModuleInit() {
        await this.$connect();
        // In your DatabaseService constructor
        console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}


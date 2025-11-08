import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpensesController } from './expenses.controller';
import { ExpenseService } from './expenses.service';
import {
  ExpenseSchema,
  EXPENSE_MODEL_NAME,
} from './schemas/expense-document.schema';
import {
  SpendingCapSchema,
  SPENDING_CAP_MODEL_NAME,
} from './schemas/spending-cap.schema';
import { USER_MODEL_NAME, UserSchema } from './schemas/user.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { parseTtlToSeconds } from './utils/time';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().default(3000),
        FRONTEND_ORIGIN: Joi.string().uri().allow('').default('http://localhost:5173'),
        MONGODB_URI: Joi.string().default('mongodb://localhost:27017/budget-buddy'),
        MONGODB_DB: Joi.string().allow(''),
        JWT_ACCESS_SECRET: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(16).required(),
          otherwise: Joi.string().allow('').default('dev_access_secret'),
        }),
        JWT_REFRESH_SECRET: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(16).required(),
          otherwise: Joi.string().allow('').default('dev_refresh_secret'),
        }),
        JWT_ACCESS_TTL: Joi.string().default('15m'),
        JWT_REFRESH_TTL: Joi.string().default('7d'),
      }),
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret =
          config.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret';
        const ttl = config.get<string>('JWT_ACCESS_TTL') || '15m';
        const expiresIn = parseTtlToSeconds(ttl);
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minute
        limit: 60, // 60 req/min by default
      },
    ]),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri =
          config.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/budget-buddy';
        const isSrv = uri.startsWith('mongodb+srv://');
        return {
          uri,
          dbName: config.get<string>('MONGODB_DB') || undefined,
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          autoIndex: true,
          ...(isSrv ? {} : { directConnection: true }),
        };
      },
    }),
    MongooseModule.forFeature([
      { name: EXPENSE_MODEL_NAME, schema: ExpenseSchema },
      { name: SPENDING_CAP_MODEL_NAME, schema: SpendingCapSchema },
      { name: USER_MODEL_NAME, schema: UserSchema },
    ]),
  ],
  controllers: [ExpensesController, AuthController],
  providers: [
    ExpenseService,
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

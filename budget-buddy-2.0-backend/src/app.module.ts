import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

function parseTtlToSeconds(value?: string): number {
  if (!value) return 900; // default 15m
  const v = String(value).trim().toLowerCase();
  const num = Number(v);
  if (!Number.isNaN(num)) return num; // already in seconds
  const match = v.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 900;
  const amount = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      return 900;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

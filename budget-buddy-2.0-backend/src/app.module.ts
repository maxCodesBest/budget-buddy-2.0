import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { ExpenseService } from './expenses.service';
import {
  ExpenseSchema,
  EXPENSE_MODEL_NAME,
} from './schemas/expense-document.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    ]),
  ],
  controllers: [AppController],
  providers: [ExpenseService],
})
export class AppModule {}

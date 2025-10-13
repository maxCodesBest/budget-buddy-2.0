import {
  EXPENSE_MODEL_NAME,
  ExpenseDocument,
} from './schemas/expense-document.schema';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(EXPENSE_MODEL_NAME)
    private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  async getExpense(req: { year: number; month: number }) {
    const { year, month } = req;
    const doc = await this.expenseModel.findOne({
      year: Number(year),
      month: Number(month),
    });

    if (doc) return doc;
    return {
      year: Number(year),
      month: Number(month),
      categories: {
        Housing: {},
        Food: {},
        Transportation: {},
        Hobbies: {},
        OneTime: {},
      },
    };
  }

  async saveExpense(req: { year: number; month: number; categories: any }) {
    const { year, month, categories } = req;

    const updated = await this.expenseModel.findOneAndUpdate(
      { year: Number(year), month: Number(month) },
      { year: Number(year), month: Number(month), categories },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return updated;
  }
}

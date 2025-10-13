// models/Expense.ts
import { Schema, Document } from 'mongoose';

export interface ExpenseDocument extends Document {
  year: number;
  month: number;
  categories: {
    [category: string]: {
      [subCategory: string]: number;
    };
  };
}

export const ExpenseSchema = new Schema<ExpenseDocument>({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  categories: { type: Schema.Types.Mixed, required: true },
});

ExpenseSchema.index({ year: 1, month: 1 }, { unique: true });

export const EXPENSE_MODEL_NAME = 'Expense';

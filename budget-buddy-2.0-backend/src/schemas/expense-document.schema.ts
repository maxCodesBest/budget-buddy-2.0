// models/Expense.ts
import { Schema, Document, Types } from 'mongoose';

export interface ExpenseDocument extends Document {
  userId: Types.ObjectId | string;
  year: number;
  month: number;
  categories: {
    [category: string]: {
      [subCategory: string]: number;
    };
  };
}

export const ExpenseSchema = new Schema<ExpenseDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  categories: { type: Schema.Types.Mixed, required: true },
});

ExpenseSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export const EXPENSE_MODEL_NAME = 'Expense';

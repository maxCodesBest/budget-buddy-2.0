import { Schema, Document } from 'mongoose';

export interface SpendingCapDocument extends Document {
  category: string;
  subCategory: string;
  cap: number;
}

export const SpendingCapSchema = new Schema<SpendingCapDocument>({
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  cap: { type: Number, required: true },
});

SpendingCapSchema.index({ category: 1, subCategory: 1 }, { unique: true });

export const SPENDING_CAP_MODEL_NAME = 'SpendingCap';

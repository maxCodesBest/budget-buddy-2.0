import { Schema, Document, Types } from 'mongoose';

export interface SpendingCapDocument extends Document {
  userId: Types.ObjectId | string;
  category: string;
  subCategory: string;
  cap: number;
}

export const SpendingCapSchema = new Schema<SpendingCapDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  cap: { type: Number, required: true },
});

SpendingCapSchema.index(
  { userId: 1, category: 1, subCategory: 1 },
  { unique: true },
);

export const SPENDING_CAP_MODEL_NAME = 'SpendingCap';

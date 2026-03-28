import { Schema, Document, Types } from 'mongoose';

export interface WeeklyNoteDocument extends Document {
  userId: Types.ObjectId | string;
  weekStart: string;
  highlights: string[];
}

export const WeeklyNoteSchema = new Schema<WeeklyNoteDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // YYYY-MM-DD of first day of note week (UTC); last day is +7 calendar days
  weekStart: { type: String, required: true },
  highlights: { type: [String], default: [] },
});

WeeklyNoteSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WEEKLY_NOTE_MODEL_NAME = 'WeeklyNote';

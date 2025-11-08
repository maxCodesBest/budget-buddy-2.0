import { Schema, Document } from 'mongoose';

export interface UserDocument extends Document {
  username: string;
  passwordHash: string;
  refreshTokenHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    refreshTokenHash: { type: String, required: false },
  },
  { timestamps: true },
);

UserSchema.index({ username: 1 }, { unique: true });

export const USER_MODEL_NAME = 'User';

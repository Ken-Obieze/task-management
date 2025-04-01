import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER
    }
  },
  {
    timestamps: true
  }
);

// Create index for email for faster queries
userSchema.index({ email: 1 });

export default mongoose.model<IUser>('User', userSchema);

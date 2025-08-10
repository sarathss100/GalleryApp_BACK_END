import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  cacheCode?: string;
  cacheCodeExpires?: Date;
  isVerified: boolean;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  cacheCode: {
    type: String,
    default: null
  },
  cacheCodeExpires: {
    type: Date,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

userSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 600,
    partialFilterExpression: { isVerified: false }
  }
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;
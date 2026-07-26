/**
 * Mongoose model (schema) for User — the "migration" for the users collection.
 *
 * Infrastructure layer: this is the ONLY place the User's MongoDB shape is
 * defined. Indexes and constraints declared here are applied to the collection
 * by Mongoose on connection (autoIndex).
 */
import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true, // enforces one account per email at the DB level
      lowercase: true,
      trim: true,
      index: true,
    },
    // bcrypt hash only — never plaintext. `select: false` means it is NOT
    // returned by default queries, so it can't leak accidentally; auth code
    // opts in explicitly with .select('+passwordHash').
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    versionKey: false,
  }
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;

export const UserModel = model('User', userSchema);

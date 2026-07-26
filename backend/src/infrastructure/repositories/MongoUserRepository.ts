/**
 * Mongoose implementation of IUserRepository (infrastructure layer).
 *
 * Translates between MongoDB documents and pure domain `User` entities so the
 * ObjectId type and Mongoose specifics never leak into the domain/application.
 */
import { UserModel } from '../models/UserModel';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { User, CreateUserInput } from '../../domain/entities/User';

/** Shape of a lean user document that INCLUDES the normally-hidden passwordHash. */
interface RawUser {
  _id: unknown;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Map a raw Mongo document to the domain entity (stringifies the id). */
function toDomain(raw: RawUser): User {
  return {
    id: String(raw._id),
    name: raw.name,
    email: raw.email,
    passwordHash: raw.passwordHash,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export class MongoUserRepository implements IUserRepository {
  async create(input: CreateUserInput): Promise<User> {
    const doc = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
    });
    // create() returns the doc; re-read fields explicitly for the mapper.
    return toDomain({
      _id: doc._id,
      name: doc.name,
      email: doc.email,
      passwordHash: input.passwordHash, // passwordHash is select:false, so take from input
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    // Explicitly select the hidden passwordHash — login needs it to compare.
    const raw = await UserModel.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .lean<RawUser | null>()
      .exec();
    return raw ? toDomain(raw) : null;
  }

  async findById(id: string): Promise<User | null> {
    const raw = await UserModel.findById(id)
      .select('+passwordHash')
      .lean<RawUser | null>()
      .exec();
    return raw ? toDomain(raw) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const found = await UserModel.exists({ email: email.toLowerCase() }).exec();
    return found !== null;
  }
}

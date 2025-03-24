import { User } from '../models/User';

export interface IUserRepository {
    addUser(user: User): Promise<User>;
    getUserById(id: string): Promise<User | null>;
    updateUser(user: User): Promise<User>;
}
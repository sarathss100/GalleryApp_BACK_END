import User, { IUser } from "../../../model/user.model";
import { BaseRepository } from "../../base/implementation/BaseRepository";
import IUserRepository from "../IUserRepository";

class UserRepository extends BaseRepository<IUser> implements IUserRepository {

    constructor() {
        super(User)
    }

    async findByEmail(email: string): Promise<IUser | null> {
        const user = await User.findOne({ email })
        if (!user) {
            return null;
        }
        return user;
    }

    async findByPhoneNumber(phoneNumber: number): Promise<IUser | null> {
        const user = await User.findOne({ phoneNumber });
        if (!user) return null;
        return user;
    }

    async createUser(data: IUser): Promise<IUser | null> {
        try {
            const user = new User(data);
            await user.save();
            return user;
        } catch (error) {
            console.error("Error creating user:", error);
            return null;
        }
    }

    async updateUser(email: string, data: Partial<IUser>): Promise<IUser | null> {
        try {
            const user = await User.findOneAndUpdate({ email }, data, { new: true });
            if (!user) {
                return null;
            }
            
            return user;
        } catch (error) {
            console.error("Error updating user:", error);
            return null;
        }
    }

}
export default UserRepository;

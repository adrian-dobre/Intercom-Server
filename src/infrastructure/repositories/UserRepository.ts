import {DiskRepository} from "./base/DiskRepository";
import {User} from "../../domain/entities/User";

export interface UserRepository extends DiskRepository<User> {
   findByUsernameAndPassword(username: string, password: string): Promise<User | null> ;
}
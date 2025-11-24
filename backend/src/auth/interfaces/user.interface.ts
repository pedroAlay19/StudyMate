import { UserRole } from "../../users/entities/user.role";

export interface UserPayload {
    sub: string;
    email: string;
    role: UserRole
}
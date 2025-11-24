import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestUser } from "../interfaces/request-user.interface";

export const ActiveUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<RequestUser>();
        return request.user;
    }
)
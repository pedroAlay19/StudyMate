import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { Transform } from 'class-transformer';


export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @Transform(({ value }: { value: string }) => value.trim())
    @IsString()
    @MinLength(6)
    password: string;
}
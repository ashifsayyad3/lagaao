import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() avatar?: string;
  @IsOptional() @IsEnum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']) gender?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
}

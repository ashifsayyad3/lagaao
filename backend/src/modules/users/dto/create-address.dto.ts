import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class CreateAddressDto {
  @IsOptional() @IsEnum(['HOME', 'OFFICE', 'OTHER']) type?: string;
  @IsString() fullName: string;
  @IsString() phone: string;
  @IsString() line1: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() city: string;
  @IsString() state: string;
  @IsString() pincode: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsString() landmark?: string;
}

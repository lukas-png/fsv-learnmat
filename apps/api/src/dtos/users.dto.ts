import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { LANGUAGES, Language } from '@utils/mail-texts';

export class CreateUserDto {
  @IsEmail()
  public email: string;

  @IsOptional()
  @IsIn(LANGUAGES)
  public lang?: Language;
}

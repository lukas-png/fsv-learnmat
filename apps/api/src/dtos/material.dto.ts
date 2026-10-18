import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LANGUAGES, Language } from '@utils/mail-texts';

export class ListMaterialDto {
  @IsString()
  public name: string;

  @IsString()
  public etag: string;
}

export class GetLinksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ListMaterialDto)
  public modules: ListMaterialDto[];

  @IsOptional()
  @IsIn(LANGUAGES)
  public lang?: Language;
}

import { Equals, IsOptional, IsString, MaxLength } from 'class-validator';

// Text fields of the multipart upload (multipart values always arrive as strings)
export class SubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  public module?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  public note?: string;

  // Confirms that the file contains no personal data and may be shared
  @Equals('true', { message: 'consent must be given' })
  public consent: string;
}

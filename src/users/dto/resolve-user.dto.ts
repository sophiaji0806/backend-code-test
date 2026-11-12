import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ResolveUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  id1!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  id2!: string;
}

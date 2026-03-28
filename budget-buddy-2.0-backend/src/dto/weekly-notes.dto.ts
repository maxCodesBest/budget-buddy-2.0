import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const HIGHLIGHT_MAX = 500;
const HIGHLIGHTS_MAX_COUNT = 100;

export class CreateWeeklyNoteBodyDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  weekAnchor!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(HIGHLIGHTS_MAX_COUNT)
  @IsString({ each: true })
  @MaxLength(HIGHLIGHT_MAX, { each: true })
  highlights?: string[];
}

export class PatchWeeklyNoteBodyDto {
  @IsArray()
  @ArrayMaxSize(HIGHLIGHTS_MAX_COUNT)
  @IsString({ each: true })
  @MaxLength(HIGHLIGHT_MAX, { each: true })
  highlights!: string[];
}

import { IsInt, Min, IsObject, IsOptional, IsString } from 'class-validator';

export class GetExpenseQueryDto {
  @IsInt()
  @Min(1970)
  year!: number;

  @IsInt()
  @Min(1)
  month!: number; // 1-12
}

export type CategoriesMap = Record<string, Record<string, number>>;

export class SaveExpenseBodyDto {
  @IsInt()
  @Min(1970)
  year!: number;

  @IsInt()
  @Min(1)
  month!: number;

  @IsObject()
  categories!: CategoriesMap;
}

export class SpendingCapQueryDto {
  @IsString()
  category!: string;

  @IsString()
  subCategory!: string;
}

export class SetSpendingCapBodyDto extends SpendingCapQueryDto {
  @IsInt()
  @Min(0)
  cap!: number;
}

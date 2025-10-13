import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ExpenseService } from './expenses.service';

@Controller('expenses')
export class AppController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get('')
  async getExpense(@Query('year') year: number, @Query('month') month: number) {
    const value = await this.expenseService.getExpense({ year, month });
    return { value };
  }

  @Post('')
  async saveExpense(
    @Body('year') year: number,
    @Body('month') month: number,
    @Body('categories') categories: any,
  ) {
    const value = await this.expenseService.saveExpense({
      year,
      month,
      categories,
    });
    return { value };
  }
}

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ExpenseService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
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

  // Spending cap endpoints
  @Get('spending-cap')
  async getSpendingCap(
    @Query('category') category: string,
    @Query('subCategory') subCategory: string,
  ) {
    const value = await this.expenseService.getSpendingCap({
      category,
      subCategory,
    });
    return { value };
  }

  @Post('spending-cap')
  async setSpendingCap(
    @Body('category') category: string,
    @Body('subCategory') subCategory: string,
    @Body('cap') cap: number,
  ) {
    const value = await this.expenseService.setSpendingCap({
      category,
      subCategory,
      cap,
    });
    return { value };
  }

  @Get('totals/by-category')
  async getTotalsByCategory() {
    const value = await this.expenseService.getAllCategoryTotals();
    return { value };
  }

  @Get('totals/by-subcategories')
  async getTotalsBySubcategories(@Query('category') category: string) {
    const value =
      await this.expenseService.getCategorySubcategoryTotals(category);
    return { value };
  }

  @Get('totals/by-month')
  async getTotalsByMonth() {
    const value = await this.expenseService.getMonthlyTotals();
    return { value };
  }
}

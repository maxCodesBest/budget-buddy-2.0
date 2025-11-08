import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ExpenseService } from './expenses.service';
import type { Request } from 'express';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get('')
  async getExpense(
    @Query('year') year: number,
    @Query('month') month: number,
    @Req() req: any,
  ) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.getExpense({ year, month, userId });
    return { value };
  }

  @Post('')
  async saveExpense(
    @Body('year') year: number,
    @Body('month') month: number,
    @Body('categories') categories: any,
    @Req() req: any,
  ) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.saveExpense({
      year,
      month,
      categories,
      userId,
    });
    return { value };
  }

  // Spending cap endpoints
  @Get('spending-cap')
  async getSpendingCap(
    @Query('category') category: string,
    @Query('subCategory') subCategory: string,
    @Req() req: any,
  ) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.getSpendingCap({
      userId,
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
    @Req() req: any,
  ) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.setSpendingCap({
      userId,
      category,
      subCategory,
      cap,
    });
    return { value };
  }

  @Get('totals/by-category')
  async getTotalsByCategory(@Req() req: any) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.getAllCategoryTotals(userId);
    return { value };
  }

  @Get('totals/by-subcategories')
  async getTotalsBySubcategories(
    @Query('category') category: string,
    @Req() req: any,
  ) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.getCategorySubcategoryTotals(
      userId,
      category,
    );
    return { value };
  }

  @Get('totals/by-month')
  async getTotalsByMonth(@Req() req: any) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.getMonthlyTotals(userId);
    return { value };
  }
}

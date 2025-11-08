import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ExpenseService } from './expenses.service';
import type { RequestWithUser } from './types/request-with-user';
import {
  GetExpenseQueryDto,
  SaveExpenseBodyDto,
  SetSpendingCapBodyDto,
  SpendingCapQueryDto,
} from './dto/expenses.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get('')
  async getExpense(
    @Query() query: GetExpenseQueryDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.getExpense({
      year: Number(query.year),
      month: Number(query.month),
      userId,
    });
    return { value };
  }

  @Post('')
  async saveExpense(@Body() body: SaveExpenseBodyDto, @Req() req: RequestWithUser) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.saveExpense({
      year: Number(body.year),
      month: Number(body.month),
      categories: body.categories,
      userId,
    });
    return { value };
  }

  // Spending cap endpoints
  @Get('spending-cap')
  async getSpendingCap(
    @Query() query: SpendingCapQueryDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.getSpendingCap({
      userId,
      category: query.category,
      subCategory: query.subCategory,
    });
    return { value };
  }

  @Post('spending-cap')
  async setSpendingCap(
    @Body() body: SetSpendingCapBodyDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.setSpendingCap({
      userId,
      category: body.category,
      subCategory: body.subCategory,
      cap: Number(body.cap),
    });
    return { value };
  }

  @Get('totals/by-category')
  async getTotalsByCategory(@Req() req: RequestWithUser) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.getAllCategoryTotals(userId);
    return { value };
  }

  @Get('totals/by-subcategories')
  async getTotalsBySubcategories(
    @Query('category') category: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.getCategorySubcategoryTotals(
      userId,
      category,
    );
    return { value };
  }

  @Get('totals/by-month')
  async getTotalsByMonth(@Req() req: RequestWithUser) {
    const userId = String(req.user?.userId || '');
    const value = await this.expenseService.getMonthlyTotals(userId);
    return { value };
  }
}

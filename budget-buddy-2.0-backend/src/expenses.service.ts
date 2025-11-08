import {
  EXPENSE_MODEL_NAME,
  ExpenseDocument,
} from './schemas/expense-document.schema';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SPENDING_CAP_MODEL_NAME,
  SpendingCapDocument,
} from './schemas/spending-cap.schema';
import type { CategoriesMap } from './dto/expenses.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(EXPENSE_MODEL_NAME)
    private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(SPENDING_CAP_MODEL_NAME)
    private readonly spendingCapModel: Model<SpendingCapDocument>,
  ) {}

  async getExpense(req: { userId: string; year: number; month: number }) {
    const { userId, year, month } = req;
    const doc = await this.expenseModel.findOne({
      userId,
      year: Number(year),
      month: Number(month),
    });

    if (doc) return doc;
    return {
      userId,
      year: Number(year),
      month: Number(month),
      categories: {
        Housing: {},
        Food: {},
        Transportation: {},
        Hobbies: {},
        OneTime: {},
      },
    };
  }

  async saveExpense(req: {
    userId: string;
    year: number;
    month: number;
    categories: CategoriesMap;
  }) {
    const { userId, year, month, categories } = req;

    const updated = await this.expenseModel.findOneAndUpdate(
      { userId, year: Number(year), month: Number(month) },
      { userId, year: Number(year), month: Number(month), categories },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return updated;
  }

  async getSpendingCap(req: {
    userId: string;
    category: string;
    subCategory: string;
  }) {
    const userId = String(req.userId || '').trim();
    const category = String(req.category || '').trim();
    const subCategory = String(req.subCategory || '').trim();

    if (!userId || !category || !subCategory) return null;

    const doc = await this.spendingCapModel.findOne({
      userId,
      category,
      subCategory,
    });
    return doc?.cap ?? null;
  }

  async setSpendingCap(req: {
    userId: string;
    category: string;
    subCategory: string;
    cap: number;
  }) {
    const userId = String(req.userId || '').trim();
    const category = String(req.category || '').trim();
    const subCategory = String(req.subCategory || '').trim();
    const cap = Number(req.cap);

    const updated = await this.spendingCapModel.findOneAndUpdate(
      { userId, category, subCategory },
      { userId, category, subCategory, cap },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return updated.cap;
  }

  async getAllCategoryTotals(userId: string) {
    const docs = await this.expenseModel
      .find({ userId }, { categories: 1 })
      .lean();
    const totals: Record<string, number> = {};
    let grand = 0;

    for (const doc of docs as Array<{
      categories?: Record<string, Record<string, number>>;
    }>) {
      const categories = (doc && (doc as any).categories) || {};
      for (const [category, entries] of Object.entries(categories)) {
        let sumForCategory = 0;
        for (const val of Object.values(entries || {})) {
          const num = Number((val as any) ?? 0);
          if (!Number.isNaN(num)) {
            sumForCategory += num;
          }
        }
        totals[category] = (totals[category] || 0) + sumForCategory;
        grand += sumForCategory;
      }
    }

    return { totals, grand };
  }

  async getCategorySubcategoryTotals(userId: string, categoryRaw: string) {
    const category = String(categoryRaw || '').trim();
    if (!category) return { totals: {}, grand: 0 };

    const docs = await this.expenseModel
      .find(
        { userId, [`categories.${category}`]: { $exists: true } },
        { categories: 1 },
      )
      .lean();

    const totals: Record<string, number> = {};
    let grand = 0;

    for (const doc of docs as Array<{
      categories?: Record<string, Record<string, number>>;
    }>) {
      const entries = (doc && (doc as any).categories?.[category]) || {};
      for (const [sub, val] of Object.entries(entries)) {
        const num = Number((val as any) ?? 0);
        if (!Number.isNaN(num)) {
          totals[sub] = (totals[sub] || 0) + num;
          grand += num;
        }
      }
    }

    return { totals, grand };
  }

  async getMonthlyTotals(userId: string) {
    const docs = await this.expenseModel
      .find({ userId }, { year: 1, month: 1, categories: 1 })
      .lean();

    const points: Array<{ year: number; month: number; total: number }> = [];
    for (const doc of docs as Array<{
      year: number;
      month: number;
      categories?: Record<string, Record<string, number>>;
    }>) {
      const categories = (doc && (doc as any).categories) || {};
      let sum = 0;
      for (const entries of Object.values(categories)) {
        for (const val of Object.values(entries || {})) {
          const num = Number((val as any) ?? 0);
          if (!Number.isNaN(num)) sum += num;
        }
      }
      points.push({
        year: Number((doc as any).year),
        month: Number((doc as any).month),
        total: sum,
      });
    }

    points.sort((a, b) => a.year - b.year || a.month - b.month);
    return { points };
  }
}

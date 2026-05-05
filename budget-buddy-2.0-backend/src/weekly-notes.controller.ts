import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { WeeklyNotesService } from './weekly-notes.service';
import type { RequestWithUser } from './types/request-with-user';
import {
  BulkCreateWeeklyNotesBodyDto,
  CreateWeeklyNoteBodyDto,
  PatchWeeklyNoteBodyDto,
} from './dto/weekly-notes.dto';

@Controller('weekly-notes')
export class WeeklyNotesController {
  constructor(private readonly weeklyNotesService: WeeklyNotesService) {}

  @Get()
  async list(@Req() req: RequestWithUser) {
    const userId = String(req.user?.userId || '');
    const notes = await this.weeklyNotesService.listForUser(userId);
    return { value: { notes } };
  }

  @Post()
  async create(
    @Body() body: CreateWeeklyNoteBodyDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = String(req.user?.userId || '');
    const highlights = body.highlights ?? [];
    const value = await this.weeklyNotesService.upsertFromAnchor(
      userId,
      body.weekAnchor,
      highlights,
    );
    return { value };
  }

  @Post('bulk')
  async bulkCreate(
    @Body() body: BulkCreateWeeklyNotesBodyDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = String(req.user?.userId || '');
    const notes = await this.weeklyNotesService.bulkUpsertFromAnchors(
      userId,
      body.notes.map((n) => ({
        weekAnchor: n.weekAnchor,
        highlights: n.highlights ?? [],
      })),
    );
    return { value: { notes } };
  }

  /** One-time migration: subtract 7 days from every note’s `weekStart`. */
  @Post('shift-all-one-week-earlier')
  async shiftAllOneWeekEarlier(@Req() req: RequestWithUser) {
    const userId = String(req.user?.userId || '');
    const value = await this.weeklyNotesService.shiftAllOneWeekEarlier(userId);
    return { value };
  }

  @Patch(':id')
  async patch(
    @Param('id') id: string,
    @Body() body: PatchWeeklyNoteBodyDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = String(req.user?.userId || '');
    const value = await this.weeklyNotesService.patchHighlights(
      userId,
      id,
      body.highlights,
    );
    return { value };
  }
}

import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WEEKLY_NOTE_MODEL_NAME,
  WeeklyNoteDocument,
} from './schemas/weekly-note.schema';
import { shiftYmdByDays, weekFirstDayFromLastDayYmd } from './utils/week';

function toNoteDto(doc: WeeklyNoteDocument) {
  return {
    id: String(doc._id),
    weekStart: doc.weekStart,
    highlights: doc.highlights || [],
  };
}

@Injectable()
export class WeeklyNotesService {
  constructor(
    @InjectModel(WEEKLY_NOTE_MODEL_NAME)
    private readonly weeklyNoteModel: Model<WeeklyNoteDocument>,
  ) {}

  async listForUser(userId: string) {
    const docs = await this.weeklyNoteModel
      .find({ userId })
      .sort({ weekStart: -1 })
      .lean()
      .exec();
    return docs.map((d) => ({
      id: String(d._id),
      weekStart: d.weekStart,
      highlights: d.highlights || [],
    }));
  }

  async upsertFromAnchor(userId: string, weekAnchor: string, highlights: string[]) {
    let weekStart: string;
    try {
      weekStart = weekFirstDayFromLastDayYmd(weekAnchor);
    } catch {
      throw new BadRequestException('Invalid weekAnchor');
    }

    const updated = await this.weeklyNoteModel.findOneAndUpdate(
      { userId, weekStart },
      { $setOnInsert: { userId, weekStart, highlights } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (!updated) throw new BadRequestException('Could not save weekly note');
    return toNoteDto(updated);
  }

  /**
   * Upserts each week and always sets highlights (for bulk import).
   */
  async bulkUpsertFromAnchors(
    userId: string,
    items: { weekAnchor: string; highlights: string[] }[],
  ) {
    const notes: ReturnType<typeof toNoteDto>[] = [];
    for (const item of items) {
      let weekStart: string;
      try {
        weekStart = weekFirstDayFromLastDayYmd(item.weekAnchor);
      } catch {
        throw new BadRequestException(`Invalid weekAnchor: ${item.weekAnchor}`);
      }
      const updated = await this.weeklyNoteModel.findOneAndUpdate(
        { userId, weekStart },
        {
          $set: { highlights: item.highlights },
          $setOnInsert: { userId, weekStart },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      if (!updated) {
        throw new BadRequestException('Could not save weekly note');
      }
      notes.push(toNoteDto(updated));
    }
    return notes;
  }

  /**
   * Moves every note’s `weekStart` back by 7 days (two-phase update for unique index).
   * Temporary migration helper for incorrectly imported weeks.
   */
  async shiftAllOneWeekEarlier(userId: string): Promise<{ updated: number }> {
    const uid = new Types.ObjectId(userId);
    const docs = await this.weeklyNoteModel.find({ userId: uid }).lean().exec();
    if (docs.length === 0) {
      return { updated: 0 };
    }

    const shifts: { id: Types.ObjectId; newWeekStart: string }[] = [];
    for (const d of docs) {
      let newWeekStart: string;
      try {
        newWeekStart = shiftYmdByDays(d.weekStart, -7);
      } catch {
        throw new BadRequestException(`Invalid weekStart in DB: ${d.weekStart}`);
      }
      shifts.push({ id: d._id as Types.ObjectId, newWeekStart });
    }

    const newKeys = shifts.map((s) => s.newWeekStart);
    if (new Set(newKeys).size !== newKeys.length) {
      throw new ConflictException(
        'Cannot shift: two notes would end up on the same week. Fix duplicates manually.',
      );
    }

    for (const s of shifts) {
      await this.weeklyNoteModel.updateOne(
        { _id: s.id, userId: uid },
        { $set: { weekStart: `__tmp_shift__${String(s.id)}` } },
      );
    }

    for (const s of shifts) {
      await this.weeklyNoteModel.updateOne(
        { _id: s.id, userId: uid },
        { $set: { weekStart: s.newWeekStart } },
      );
    }

    return { updated: shifts.length };
  }

  async patchHighlights(userId: string, id: string, highlights: string[]) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException();
    }
    const updated = await this.weeklyNoteModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId },
      { highlights },
      { new: true },
    );
    if (!updated) throw new NotFoundException();
    return toNoteDto(updated);
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WEEKLY_NOTE_MODEL_NAME,
  WeeklyNoteDocument,
} from './schemas/weekly-note.schema';
import { weekFirstDayFromLastDayYmd } from './utils/week';

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

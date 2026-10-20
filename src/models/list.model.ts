import { Schema, model, models, Document, Types } from 'mongoose';

export interface IList extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ListSchema = new Schema<IList>(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la liste est obligatoire'],
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    color: {
      type: String,
      match: [/^#[0-9A-Fa-f]{6}$/, 'La couleur doit être au format hexadécimal #RRGGBB'],
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'lists',
  },
);

export const ListModel = models.List || model<IList>('List', ListSchema);

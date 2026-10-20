import { Schema, model, models, Document, Types } from 'mongoose';

export interface IList extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
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
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'lists',
  },
);

export const ListModel = models.List || model<IList>('List', ListSchema);

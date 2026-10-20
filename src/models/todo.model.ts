import { Schema, model, models, Document, Types } from 'mongoose';

export interface ITodo extends Document {
  _id: Types.ObjectId;
  listId: Types.ObjectId;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TodoSchema = new Schema<ITodo>(
  {
    listId: {
      type: Schema.Types.ObjectId,
      ref: 'List',
      required: [true, 'listId est obligatoire'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Le titre du todo est obligatoire'],
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'todos',
  },
);

export const TodoModel = models.Todo || model<ITodo>('Todo', TodoSchema);

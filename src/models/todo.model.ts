import { Schema, model, models, Document, Types } from 'mongoose';

export const TODO_STATUSES = ['todo', 'in_progress', 'done'] as const;
export const TODO_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TodoStatus = (typeof TODO_STATUSES)[number];
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export interface ISubtask {
  _id: Types.ObjectId;
  title: string;
  done: boolean;
}

export interface ITodo extends Document {
  _id: Types.ObjectId;
  listId: Types.ObjectId;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: Date | null;
  completedAt?: Date | null;
  tags: string[];
  subtasks: ISubtask[];
  position?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubtaskSchema = new Schema<ISubtask>(
  {
    title: {
      type: String,
      required: [true, 'Le titre de la sous-tâche est obligatoire'],
      trim: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

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
    status: {
      type: String,
      enum: TODO_STATUSES,
      default: 'todo',
      required: true,
    },
    priority: {
      type: String,
      enum: TODO_PRIORITIES,
      default: 'medium',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    subtasks: {
      type: [SubtaskSchema],
      default: [],
    },
    position: {
      type: Number,
    },
  },
  {
    timestamps: true,
    collection: 'todos',
  },
);

export const TodoModel = models.Todo || model<ITodo>('Todo', TodoSchema);

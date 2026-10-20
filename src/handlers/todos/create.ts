import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from '../../config/db';
import { TodoModel, TODO_STATUSES, TODO_PRIORITIES } from '../../models/todo.model';
import { ListModel } from '../../models/list.model';
import { success, error } from '../../utils/response';
import { isValidObjectId } from '../../utils/validation';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { listId, title, description, status, priority, dueDate, tags, subtasks, position } = body;

    if (!isValidObjectId(listId)) {
      return error(400, 'Le champ "listId" est obligatoire et doit être un ObjectId valide');
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return error(400, 'Le champ "title" est obligatoire');
    }

    if (status !== undefined && !TODO_STATUSES.includes(status)) {
      return error(400, `Le champ "status" doit être l'une des valeurs: ${TODO_STATUSES.join(', ')}`);
    }

    if (priority !== undefined && !TODO_PRIORITIES.includes(priority)) {
      return error(400, `Le champ "priority" doit être l'une des valeurs: ${TODO_PRIORITIES.join(', ')}`);
    }

    await connectToDatabase();

    const listExists = await ListModel.exists({ _id: listId });
    if (!listExists) {
      return error(404, 'La liste associée est introuvable');
    }

    const todo = await TodoModel.create({
      listId,
      title: title.trim(),
      description,
      status,
      priority,
      dueDate: dueDate ?? null,
      tags,
      subtasks,
      position,
    });

    return success(201, todo);
  } catch (err: any) {
    if (err?.name === 'ValidationError') {
      return error(400, 'Données invalides', err.errors);
    }
    return error(500, 'Erreur interne du serveur', err?.message);
  }
}

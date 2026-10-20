import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from '../../config/db';
import { TodoModel } from '../../models/todo.model';
import { ListModel } from '../../models/list.model';
import { success, error } from '../../utils/response';
import { isValidObjectId } from '../../utils/validation';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;

    if (!isValidObjectId(id)) {
      return error(400, 'Identifiant de todo invalide');
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { title, description, completed, dueDate, listId } = body;

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return error(400, 'Le champ "title" doit être une chaîne non vide');
    }

    if (listId !== undefined && !isValidObjectId(listId)) {
      return error(400, 'Le champ "listId" doit être un ObjectId valide');
    }

    await connectToDatabase();

    if (listId !== undefined) {
      const listExists = await ListModel.exists({ _id: listId });
      if (!listExists) {
        return error(404, 'La liste associée est introuvable');
      }
    }

    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description;
    if (completed !== undefined) update.completed = completed;
    if (dueDate !== undefined) update.dueDate = dueDate;
    if (listId !== undefined) update.listId = listId;

    const todo = await TodoModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!todo) {
      return error(404, 'Todo non trouvé');
    }

    return success(200, todo);
  } catch (err: any) {
    if (err?.name === 'ValidationError') {
      return error(400, 'Données invalides', err.errors);
    }
    return error(500, 'Erreur interne du serveur', err?.message);
  }
}

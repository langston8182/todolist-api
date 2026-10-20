import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from '../../config/db';
import { TodoModel } from '../../models/todo.model';
import { success, error } from '../../utils/response';
import { isValidObjectId } from '../../utils/validation';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const listId = event.queryStringParameters?.listId;

    if (listId && !isValidObjectId(listId)) {
      return error(400, 'Le paramètre "listId" doit être un ObjectId valide');
    }

    await connectToDatabase();

    const filter = listId ? { listId } : {};
    const todos = await TodoModel.find(filter).sort({ createdAt: -1 });

    return success(200, todos);
  } catch (err: any) {
    return error(500, 'Erreur interne du serveur', err?.message);
  }
}

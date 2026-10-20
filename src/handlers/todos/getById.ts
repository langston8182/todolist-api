import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from '../../config/db';
import { TodoModel } from '../../models/todo.model';
import { success, error } from '../../utils/response';
import { isValidObjectId } from '../../utils/validation';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;

    if (!isValidObjectId(id)) {
      return error(400, 'Identifiant de todo invalide');
    }

    await connectToDatabase();

    const todo = await TodoModel.findById(id);

    if (!todo) {
      return error(404, 'Todo non trouvé');
    }

    return success(200, todo);
  } catch (err: any) {
    return error(500, 'Erreur interne du serveur', err?.message);
  }
}

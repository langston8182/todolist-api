import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from '../../config/db';
import { ListModel } from '../../models/list.model';
import { TodoModel } from '../../models/todo.model';
import { noContent, error } from '../../utils/response';
import { isValidObjectId } from '../../utils/validation';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;

    if (!isValidObjectId(id)) {
      return error(400, 'Identifiant de liste invalide');
    }

    await connectToDatabase();

    const list = await ListModel.findByIdAndDelete(id);

    if (!list) {
      return error(404, 'Liste non trouvée');
    }

    // Supprime en cascade les todos rattachés à cette liste
    await TodoModel.deleteMany({ listId: id });

    return noContent();
  } catch (err: any) {
    return error(500, 'Erreur interne du serveur', err?.message);
  }
}

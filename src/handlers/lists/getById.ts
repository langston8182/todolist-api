import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from '../../config/db';
import { ListModel } from '../../models/list.model';
import { success, error } from '../../utils/response';
import { isValidObjectId } from '../../utils/validation';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const id = event.pathParameters?.id;

    if (!isValidObjectId(id)) {
      return error(400, 'Identifiant de liste invalide');
    }

    await connectToDatabase();

    const list = await ListModel.findById(id);

    if (!list) {
      return error(404, 'Liste non trouvée');
    }

    return success(200, list);
  } catch (err: any) {
    return error(500, 'Erreur interne du serveur', err?.message);
  }
}

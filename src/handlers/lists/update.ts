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

    const body = event.body ? JSON.parse(event.body) : {};
    const { name, description, color, archived } = body;

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return error(400, 'Le champ "name" doit être une chaîne non vide');
    }

    await connectToDatabase();

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description;
    if (color !== undefined) update.color = color;
    if (archived !== undefined) update.archived = archived;

    const list = await ListModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!list) {
      return error(404, 'Liste non trouvée');
    }

    return success(200, list);
  } catch (err: any) {
    if (err?.name === 'ValidationError') {
      return error(400, 'Données invalides', err.errors);
    }
    return error(500, 'Erreur interne du serveur', err?.message);
  }
}

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from '../../config/db';
import { ListModel } from '../../models/list.model';
import { success, error } from '../../utils/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    await connectToDatabase();

    const body = event.body ? JSON.parse(event.body) : {};
    const { name, description, color, archived } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return error(400, 'Le champ "name" est obligatoire');
    }

    const list = await ListModel.create({ name: name.trim(), description, color, archived });

    return success(201, list);
  } catch (err: any) {
    if (err?.name === 'ValidationError') {
      return error(400, 'Données invalides', err.errors);
    }
    return error(500, 'Erreur interne du serveur', err?.message);
  }
}

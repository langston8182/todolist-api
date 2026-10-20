import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase } from '../../config/db';
import { ListModel } from '../../models/list.model';
import { success, error } from '../../utils/response';

export async function handler(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    await connectToDatabase();

    const lists = await ListModel.find().sort({ createdAt: -1 });

    return success(200, lists);
  } catch (err: any) {
    return error(500, 'Erreur interne du serveur', err?.message);
  }
}

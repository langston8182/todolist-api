import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../../../src/config/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../src/models/list.model', () => ({
  ListModel: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.mock('../../../src/models/todo.model', () => ({
  TodoModel: {
    deleteMany: jest.fn(),
  },
}));

import { ListModel } from '../../../src/models/list.model';
import { TodoModel } from '../../../src/models/todo.model';
import { handler as createHandler } from '../../../src/handlers/lists/create';
import { handler as getAllHandler } from '../../../src/handlers/lists/getAll';
import { handler as getByIdHandler } from '../../../src/handlers/lists/getById';
import { handler as updateHandler } from '../../../src/handlers/lists/update';
import { handler as removeHandler } from '../../../src/handlers/lists/remove';

const VALID_ID = '507f1f77bcf86cd799439011';

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    body: null,
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    ...overrides,
  } as APIGatewayProxyEvent;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('lists handlers (unit)', () => {
  describe('create', () => {
    it('crée une liste avec succès', async () => {
      const fakeList = { _id: VALID_ID, name: 'Courses', description: '' };
      (ListModel.create as jest.Mock).mockResolvedValue(fakeList);

      const event = buildEvent({ body: JSON.stringify({ name: 'Courses' }) });
      const result = await createHandler(event);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(fakeList);
      expect(ListModel.create).toHaveBeenCalledWith({ name: 'Courses', description: undefined });
    });

    it("retourne 400 si le nom est manquant", async () => {
      const event = buildEvent({ body: JSON.stringify({}) });
      const result = await createHandler(event);

      expect(result.statusCode).toBe(400);
      expect(ListModel.create).not.toHaveBeenCalled();
    });

    it('retourne 500 en cas d\'erreur serveur', async () => {
      (ListModel.create as jest.Mock).mockRejectedValue(new Error('db down'));
      const event = buildEvent({ body: JSON.stringify({ name: 'Courses' }) });

      const result = await createHandler(event);

      expect(result.statusCode).toBe(500);
    });
  });

  describe('getAll', () => {
    it('retourne la liste des listes', async () => {
      const fakeLists = [{ _id: VALID_ID, name: 'Courses' }];
      (ListModel.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(fakeLists) });

      const result = await getAllHandler(buildEvent());

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(fakeLists);
    });
  });

  describe('getById', () => {
    it("retourne 400 pour un id invalide", async () => {
      const result = await getByIdHandler(buildEvent({ pathParameters: { id: 'invalid' } }));
      expect(result.statusCode).toBe(400);
    });

    it('retourne 404 si la liste est introuvable', async () => {
      (ListModel.findById as jest.Mock).mockResolvedValue(null);
      const result = await getByIdHandler(buildEvent({ pathParameters: { id: VALID_ID } }));
      expect(result.statusCode).toBe(404);
    });

    it('retourne 200 avec la liste trouvée', async () => {
      const fakeList = { _id: VALID_ID, name: 'Courses' };
      (ListModel.findById as jest.Mock).mockResolvedValue(fakeList);
      const result = await getByIdHandler(buildEvent({ pathParameters: { id: VALID_ID } }));
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(fakeList);
    });
  });

  describe('update', () => {
    it('met à jour une liste existante', async () => {
      const updated = { _id: VALID_ID, name: 'Courses MAJ' };
      (ListModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const event = buildEvent({
        pathParameters: { id: VALID_ID },
        body: JSON.stringify({ name: 'Courses MAJ' }),
      });
      const result = await updateHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(updated);
    });

    it('retourne 404 si la liste n\'existe pas', async () => {
      (ListModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
      const event = buildEvent({
        pathParameters: { id: VALID_ID },
        body: JSON.stringify({ name: 'Courses MAJ' }),
      });
      const result = await updateHandler(event);
      expect(result.statusCode).toBe(404);
    });

    it('retourne 400 si le nom fourni est vide', async () => {
      const event = buildEvent({
        pathParameters: { id: VALID_ID },
        body: JSON.stringify({ name: '   ' }),
      });
      const result = await updateHandler(event);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('remove', () => {
    it('supprime une liste et ses todos associés', async () => {
      (ListModel.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: VALID_ID });
      (TodoModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });

      const result = await removeHandler(buildEvent({ pathParameters: { id: VALID_ID } }));

      expect(result.statusCode).toBe(204);
      expect(TodoModel.deleteMany).toHaveBeenCalledWith({ listId: VALID_ID });
    });

    it('retourne 404 si la liste n\'existe pas', async () => {
      (ListModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
      const result = await removeHandler(buildEvent({ pathParameters: { id: VALID_ID } }));
      expect(result.statusCode).toBe(404);
      expect(TodoModel.deleteMany).not.toHaveBeenCalled();
    });
  });
});

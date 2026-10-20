import { APIGatewayProxyEvent } from 'aws-lambda';

jest.mock('../../../src/config/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../src/models/todo.model', () => {
  const actual = jest.requireActual('../../../src/models/todo.model');
  return {
    ...actual,
    TodoModel: {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    },
  };
});

jest.mock('../../../src/models/list.model', () => ({
  ListModel: {
    exists: jest.fn(),
  },
}));

import { TodoModel } from '../../../src/models/todo.model';
import { ListModel } from '../../../src/models/list.model';
import { handler as createHandler } from '../../../src/handlers/todos/create';
import { handler as getAllHandler } from '../../../src/handlers/todos/getAll';
import { handler as getByIdHandler } from '../../../src/handlers/todos/getById';
import { handler as updateHandler } from '../../../src/handlers/todos/update';
import { handler as removeHandler } from '../../../src/handlers/todos/remove';

const VALID_ID = '507f1f77bcf86cd799439011';
const VALID_LIST_ID = '507f1f77bcf86cd799439022';

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

describe('todos handlers (unit)', () => {
  describe('create', () => {
    it('crée un todo avec succès', async () => {
      (ListModel.exists as jest.Mock).mockResolvedValue(true);
      const fakeTodo = {
        _id: VALID_ID,
        listId: VALID_LIST_ID,
        title: 'Acheter du pain',
        status: 'todo',
        priority: 'medium',
      };
      (TodoModel.create as jest.Mock).mockResolvedValue(fakeTodo);

      const event = buildEvent({
        body: JSON.stringify({ listId: VALID_LIST_ID, title: 'Acheter du pain' }),
      });
      const result = await createHandler(event);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual(fakeTodo);
    });

    it('retourne 400 si listId est invalide', async () => {
      const event = buildEvent({ body: JSON.stringify({ listId: 'invalid', title: 'Test' }) });
      const result = await createHandler(event);
      expect(result.statusCode).toBe(400);
      expect(TodoModel.create).not.toHaveBeenCalled();
    });

    it('retourne 400 si title est manquant', async () => {
      const event = buildEvent({ body: JSON.stringify({ listId: VALID_LIST_ID }) });
      const result = await createHandler(event);
      expect(result.statusCode).toBe(400);
    });

    it('retourne 400 si status est invalide', async () => {
      const event = buildEvent({
        body: JSON.stringify({ listId: VALID_LIST_ID, title: 'Test', status: 'nope' }),
      });
      const result = await createHandler(event);
      expect(result.statusCode).toBe(400);
      expect(TodoModel.create).not.toHaveBeenCalled();
    });

    it('retourne 400 si priority est invalide', async () => {
      const event = buildEvent({
        body: JSON.stringify({ listId: VALID_LIST_ID, title: 'Test', priority: 'urgent' }),
      });
      const result = await createHandler(event);
      expect(result.statusCode).toBe(400);
      expect(TodoModel.create).not.toHaveBeenCalled();
    });

    it("retourne 404 si la liste associée n'existe pas", async () => {
      (ListModel.exists as jest.Mock).mockResolvedValue(false);
      const event = buildEvent({
        body: JSON.stringify({ listId: VALID_LIST_ID, title: 'Acheter du pain' }),
      });
      const result = await createHandler(event);
      expect(result.statusCode).toBe(404);
      expect(TodoModel.create).not.toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('retourne tous les todos sans filtre', async () => {
      const fakeTodos = [{ _id: VALID_ID, title: 'Acheter du pain' }];
      (TodoModel.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(fakeTodos) });

      const result = await getAllHandler(buildEvent());

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(fakeTodos);
      expect(TodoModel.find).toHaveBeenCalledWith({});
    });

    it('filtre par listId quand fourni', async () => {
      (TodoModel.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      await getAllHandler(buildEvent({ queryStringParameters: { listId: VALID_LIST_ID } }));

      expect(TodoModel.find).toHaveBeenCalledWith({ listId: VALID_LIST_ID });
    });

    it('retourne 400 si listId fourni est invalide', async () => {
      const result = await getAllHandler(buildEvent({ queryStringParameters: { listId: 'bad' } }));
      expect(result.statusCode).toBe(400);
    });
  });

  describe('getById', () => {
    it('retourne 404 si le todo est introuvable', async () => {
      (TodoModel.findById as jest.Mock).mockResolvedValue(null);
      const result = await getByIdHandler(buildEvent({ pathParameters: { id: VALID_ID } }));
      expect(result.statusCode).toBe(404);
    });

    it('retourne 200 avec le todo trouvé', async () => {
      const fakeTodo = { _id: VALID_ID, title: 'Acheter du pain' };
      (TodoModel.findById as jest.Mock).mockResolvedValue(fakeTodo);
      const result = await getByIdHandler(buildEvent({ pathParameters: { id: VALID_ID } }));
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(fakeTodo);
    });
  });

  describe('update', () => {
    it('met à jour un todo existant', async () => {
      const updated = { _id: VALID_ID, title: 'Acheter du pain complet', status: 'done' };
      (TodoModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const event = buildEvent({
        pathParameters: { id: VALID_ID },
        body: JSON.stringify({ title: 'Acheter du pain complet', status: 'done' }),
      });
      const result = await updateHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(updated);
    });

    it('retourne 400 si status est invalide', async () => {
      const event = buildEvent({
        pathParameters: { id: VALID_ID },
        body: JSON.stringify({ status: 'nope' }),
      });
      const result = await updateHandler(event);
      expect(result.statusCode).toBe(400);
      expect(TodoModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("retourne 404 si la nouvelle liste n'existe pas", async () => {
      (ListModel.exists as jest.Mock).mockResolvedValue(false);
      const event = buildEvent({
        pathParameters: { id: VALID_ID },
        body: JSON.stringify({ listId: VALID_LIST_ID }),
      });
      const result = await updateHandler(event);
      expect(result.statusCode).toBe(404);
      expect(TodoModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('retourne 404 si le todo est introuvable', async () => {
      (TodoModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
      const event = buildEvent({
        pathParameters: { id: VALID_ID },
        body: JSON.stringify({ priority: 'high' }),
      });
      const result = await updateHandler(event);
      expect(result.statusCode).toBe(404);
    });
  });

  describe('remove', () => {
    it('supprime un todo existant', async () => {
      (TodoModel.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: VALID_ID });
      const result = await removeHandler(buildEvent({ pathParameters: { id: VALID_ID } }));
      expect(result.statusCode).toBe(204);
    });

    it('retourne 404 si le todo est introuvable', async () => {
      (TodoModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
      const result = await removeHandler(buildEvent({ pathParameters: { id: VALID_ID } }));
      expect(result.statusCode).toBe(404);
    });
  });
});

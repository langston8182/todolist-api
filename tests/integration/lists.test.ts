import { APIGatewayProxyEvent } from 'aws-lambda';
import { startInMemoryDatabase, stopInMemoryDatabase, clearAllCollections } from '../helpers/setupTestDb';
import { connectToDatabase } from '../../src/config/db';

import { handler as createHandler } from '../../src/handlers/lists/create';
import { handler as getAllHandler } from '../../src/handlers/lists/getAll';
import { handler as getByIdHandler } from '../../src/handlers/lists/getById';
import { handler as updateHandler } from '../../src/handlers/lists/update';
import { handler as removeHandler } from '../../src/handlers/lists/remove';
import { handler as createTodoHandler } from '../../src/handlers/todos/create';
import { handler as getAllTodosHandler } from '../../src/handlers/todos/getAll';

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    body: null,
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    ...overrides,
  } as APIGatewayProxyEvent;
}

beforeAll(async () => {
  await startInMemoryDatabase();
  await connectToDatabase();
});

afterEach(async () => {
  await clearAllCollections();
});

afterAll(async () => {
  await stopInMemoryDatabase();
});

describe('Lists CRUD (integration)', () => {
  it('crée puis récupère une liste', async () => {
    const createResult = await createHandler(
      buildEvent({ body: JSON.stringify({ name: 'Courses', description: 'Liste de courses' }) }),
    );
    expect(createResult.statusCode).toBe(201);
    const created = JSON.parse(createResult.body);
    expect(created.name).toBe('Courses');

    const getResult = await getByIdHandler(buildEvent({ pathParameters: { id: created._id } }));
    expect(getResult.statusCode).toBe(200);
    expect(JSON.parse(getResult.body)._id).toBe(created._id);
  });

  it('liste toutes les listes créées', async () => {
    await createHandler(buildEvent({ body: JSON.stringify({ name: 'Courses' }) }));
    await createHandler(buildEvent({ body: JSON.stringify({ name: 'Travail' }) }));

    const result = await getAllHandler(buildEvent());
    const lists = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(lists).toHaveLength(2);
  });

  it('met à jour une liste', async () => {
    const createResult = await createHandler(buildEvent({ body: JSON.stringify({ name: 'Courses' }) }));
    const created = JSON.parse(createResult.body);

    const updateResult = await updateHandler(
      buildEvent({ pathParameters: { id: created._id }, body: JSON.stringify({ name: 'Courses MAJ' }) }),
    );

    expect(updateResult.statusCode).toBe(200);
    expect(JSON.parse(updateResult.body).name).toBe('Courses MAJ');
  });

  it('supprime une liste et ses todos associés (cascade)', async () => {
    const createResult = await createHandler(buildEvent({ body: JSON.stringify({ name: 'Courses' }) }));
    const createdList = JSON.parse(createResult.body);

    await createTodoHandler(
      buildEvent({ body: JSON.stringify({ listId: createdList._id, title: 'Acheter du pain' }) }),
    );

    const deleteResult = await removeHandler(buildEvent({ pathParameters: { id: createdList._id } }));
    expect(deleteResult.statusCode).toBe(204);

    const getDeletedResult = await getByIdHandler(buildEvent({ pathParameters: { id: createdList._id } }));
    expect(getDeletedResult.statusCode).toBe(404);

    const remainingTodos = JSON.parse(
      (await getAllTodosHandler(buildEvent({ queryStringParameters: { listId: createdList._id } }))).body,
    );
    expect(remainingTodos).toHaveLength(0);
  });

  it('retourne 404 pour une liste inexistante', async () => {
    const result = await getByIdHandler(buildEvent({ pathParameters: { id: '507f1f77bcf86cd799439011' } }));
    expect(result.statusCode).toBe(404);
  });
});

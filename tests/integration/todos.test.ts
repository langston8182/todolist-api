import { APIGatewayProxyEvent } from 'aws-lambda';
import { startInMemoryDatabase, stopInMemoryDatabase, clearAllCollections } from '../helpers/setupTestDb';
import { connectToDatabase } from '../../src/config/db';

import { handler as createListHandler } from '../../src/handlers/lists/create';
import { handler as createTodoHandler } from '../../src/handlers/todos/create';
import { handler as getAllTodosHandler } from '../../src/handlers/todos/getAll';
import { handler as getTodoByIdHandler } from '../../src/handlers/todos/getById';
import { handler as updateTodoHandler } from '../../src/handlers/todos/update';
import { handler as removeTodoHandler } from '../../src/handlers/todos/remove';

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    body: null,
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    ...overrides,
  } as APIGatewayProxyEvent;
}

async function createTestList(name = 'Courses'): Promise<any> {
  const result = await createListHandler(buildEvent({ body: JSON.stringify({ name }) }));
  return JSON.parse(result.body);
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

describe('Todos CRUD (integration)', () => {
  it('crée un todo rattaché à une liste existante', async () => {
    const list = await createTestList();

    const result = await createTodoHandler(
      buildEvent({ body: JSON.stringify({ listId: list._id, title: 'Acheter du pain' }) }),
    );

    expect(result.statusCode).toBe(201);
    const todo = JSON.parse(result.body);
    expect(todo.title).toBe('Acheter du pain');
    expect(todo.completed).toBe(false);
    expect(todo.listId).toBe(list._id);
  });

  it("refuse la création si la liste n'existe pas", async () => {
    const result = await createTodoHandler(
      buildEvent({ body: JSON.stringify({ listId: '507f1f77bcf86cd799439011', title: 'Test' }) }),
    );
    expect(result.statusCode).toBe(404);
  });

  it('filtre les todos par listId', async () => {
    const listA = await createTestList('Courses');
    const listB = await createTestList('Travail');

    await createTodoHandler(buildEvent({ body: JSON.stringify({ listId: listA._id, title: 'Pain' }) }));
    await createTodoHandler(buildEvent({ body: JSON.stringify({ listId: listB._id, title: 'Rapport' }) }));

    const result = await getAllTodosHandler(buildEvent({ queryStringParameters: { listId: listA._id } }));
    const todos = JSON.parse(result.body);

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe('Pain');
  });

  it('marque un todo comme terminé', async () => {
    const list = await createTestList();
    const created = JSON.parse(
      (await createTodoHandler(buildEvent({ body: JSON.stringify({ listId: list._id, title: 'Pain' }) }))).body,
    );

    const updateResult = await updateTodoHandler(
      buildEvent({ pathParameters: { id: created._id }, body: JSON.stringify({ completed: true }) }),
    );

    expect(updateResult.statusCode).toBe(200);
    expect(JSON.parse(updateResult.body).completed).toBe(true);
  });

  it('supprime un todo', async () => {
    const list = await createTestList();
    const created = JSON.parse(
      (await createTodoHandler(buildEvent({ body: JSON.stringify({ listId: list._id, title: 'Pain' }) }))).body,
    );

    const deleteResult = await removeTodoHandler(buildEvent({ pathParameters: { id: created._id } }));
    expect(deleteResult.statusCode).toBe(204);

    const getResult = await getTodoByIdHandler(buildEvent({ pathParameters: { id: created._id } }));
    expect(getResult.statusCode).toBe(404);
  });
});

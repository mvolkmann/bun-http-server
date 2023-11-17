import {Database} from 'bun:sqlite';
import {randomUUID} from 'node:crypto';

const db = new Database('todos.db', {create: true});
const addStmt = db.prepare(
  'insert into todos (id, text, completed) values (?, ?, ?)'
);
const changesQuery = db.prepare('select changes()');
const deleteStmt = db.prepare('delete from todos where id = ?');
const getAllQuery = db.query('select * from todos');
const updateStmt = db.prepare(
  'update todos set text = ?, completed = ? where id = ?'
);

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

// TODO: Change this to demonstrate the builtin SQLite support.
// const todos: {[id: string]: Todo} = {};

type Route = (req: Request) => Response | Promise<Response>;

const stringRoutes: {[key: string]: Route | undefined} = {
  'GET /': getHome,
  'GET /demo': getDemo,
  'GET /todo': getTodos,
  'POST /todo': addTodo
};

const regExpRoutes = new Map<RegExp, Route | undefined>();
regExpRoutes.set(/DELETE \/todo\/[\w-]+$/, deleteTodo);
regExpRoutes.set(/PUT \/todo\/[\w-]+$/, updateTodo);

const notFound = new Response('Not Found', {status: 404});

async function addTodo(req: Request): Promise<Response> {
  const {text} = await req.json();
  const id = randomUUID();
  addStmt.run(id, text, false);
  const todo = {id, text, completed: false};
  return Response.json(todo);
}

function changes() {
  const result = changesQuery.get() as {[key: string]: number};
  return result['changes()'];
}

async function deleteTodo(req: Request): Promise<Response> {
  const id = getLastPathParam(req);
  deleteStmt.run(id);
  return changes() ? new Response('') : notFound;
}

function getDemo(): Response {
  return new Response('Hello from demo!');
}

function getHome(): Response {
  const bar = Bun.env.FOO;
  const res = new Response(`<h1 style="color: red">Hello, ${bar}</h1>`);
  res.headers.set('Content-Type', 'text/html');
  return res;
}

function getRoute(req: Request): Route | undefined {
  const {method} = req;
  const url = new URL(req.url);
  const route = stringRoutes[`${method} ${url.pathname}`];
  if (route) return route;

  const {pathname} = url;
  for (const [regExp, route] of regExpRoutes) {
    if (regExp.test(`${method} ${pathname}`)) return route;
  }

  return undefined;
}

function getTodos(): Response {
  const todos = getAllQuery.all(); // get method only returns first
  // const res = new Response(JSON.stringify(todos));
  // res.headers.set('Content-Type', 'application/json');
  // return res;
  return Response.json(todos);
}

function getLastPathParam(req: Request): string {
  const {url} = req;
  const index = url.lastIndexOf('/');
  return url.substring(index + 1);
}

async function updateTodo(req: Request): Promise<Response> {
  const id = getLastPathParam(req);
  const todo = await req.json();
  todo.id = id;
  const result = updateStmt.run(todo.text, todo.completed, id);
  return changes() ? Response.json(todo) : notFound;
}

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    // TODO: Add an example of serving a static HTML file.
    const route = getRoute(req);
    return route ? route(req) : notFound;
  }
});

console.log('Server started on port', server.port);

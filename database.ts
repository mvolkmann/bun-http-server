import {Database} from 'bun:sqlite';

const db = new Database('todos.db', {create: true});
const query = db.query('select * from todos;');
const todos = query.all(); // get();
console.log(todos);

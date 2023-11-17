import React from 'react';

// function MyComponent() {
//   return <h1 style="color: red">Hello, JSX!</h1>;
// }

const server = Bun.serve({
  port: 3000,
  fetch(/* req */) {
    const res = new Response(<h1 style="color: red">Hello, Bun!</h1>);
    res.headers.set('Content-Type', 'text/html');
    return res;
  }
});

console.log('Server started on port', server.port);

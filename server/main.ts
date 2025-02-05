import { serve } from "https://deno.land/std@0.194.0/http/server.ts";

// To-do record interface
interface TodoRecord {
  content: string;
  is_complete: boolean;
}

// In-memory database
const database: Record<number, TodoRecord> = {};
let idCounter: number = 0;

async function handleCreate(request: Request): Promise<Response> {
  try {
    const { content, is_complete } = await request.json();

    if (typeof content !== "string" || typeof is_complete !== "boolean") {
      return new Response(
        JSON.stringify({
          error:
            "Invalid request body. 'content' (string) and 'is_complete' (boolean) are required.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const id = ++idCounter;
    database[id] = { content, is_complete };
    console.log(`Successfully created to-do ${id}`);
    return new Response(JSON.stringify({ id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body", details: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

function handleGetById(pathname: string): Response {
  const idStr = pathname.slice(1); // Extract ID from path
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = database[id];
  if (!record) {
    console.log(`Unable to get to-do ${id} as it was not found`);
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  console.log(
    `Successfully got to-do ${id} - returning ${JSON.stringify(record)}`,
  );

  // Convert the record to JSON for the response.  Typescript handles the conversion nicely.
  return new Response(JSON.stringify(record), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function handleDeleteById(pathname: string): Response {
  const idStr = pathname.slice(1);
  const id = parseInt(idStr, 10);

  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (database[id] === undefined) {
    console.log(`Failed to delete to-do ${id} as it was not found`);
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  delete database[id];
  console.log(`Successfully deleted to-do ${id}`);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function handleNotFound() {
  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

  // Create a new to-do
  if (request.method === "POST" && pathname === "/") {
    console.log("matched create route", { pathname, method: request.method });
    return await handleCreate(request);
  }

  // Get an existing to-do by ID
  if (request.method === "GET" && pathname.match(/\/\d+/)) {
    console.log("matched get by id route", {
      pathname,
      method: request.method,
    });
    return handleGetById(pathname);
  }

  // Delete an existing to-do by ID
  if (request.method === "DELETE" && pathname.startsWith("/")) {
    console.log("matched delete route", { pathname, method: request.method });
    return handleDeleteById(pathname);
  }

  // Handle other/invalid requests
  console.log("no route matched", { pathname, method: request.method });
  return handleNotFound();
}

if (import.meta.main) {
  serve(handleRequest, { port: 800 });
}

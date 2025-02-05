// To-do record interface
interface TodoRecord {
  content: string;
  is_complete: boolean;
}

// HTTP client for interacting with the to-do server
class TodoClient {
  private readonly serverUrl: string;

  constructor(serverUrl: string = "http://localhost:8000") {
    this.serverUrl = serverUrl;
  }

  // Get a to-do record by its ID
  async get(id: number): Promise<TodoRecord | null> {
    const response = await fetch(`${this.serverUrl}/${id}`);

    if (response.status === 200) {
      const json: TodoRecord = await response.json();
      console.log(`got json: ${JSON.stringify(json)}`);
      return json;
    } else if (response.status === 404) {
      return null;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  }

  // Create a to-do record
  async create(todoRecord: Omit<TodoRecord, "id">): Promise<number> {
    const response = await fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(todoRecord),
    });

    if (response.status === 200) {
      const json: { id: number } = await response.json();
      console.log(`got json: ${JSON.stringify(json)}`);
      return json.id;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  }

  // Delete a to-do record
  async delete(id: number): Promise<boolean> {
    const response = await fetch(`${this.serverUrl}/${id}`, {
      method: "DELETE",
    });

    return response.status === 200;
  }
}

async function main() {
  // create the client
  const client = new TodoClient();

  // check does not exist for -1
  const nonExistingId = -1;
  const doesNotExistYet = await client.get(nonExistingId);
  if (doesNotExistYet !== null) {
    console.error(`${nonExistingId} should never exist!`);
  } else {
    console.log(
      `As expected, received null from server for ${nonExistingId}`,
    );
  }

  // create a new to-do
  const todoRecord: Omit<TodoRecord, "id"> = {
    content: "complete a coding test",
    is_complete: false,
  };
  const newId = await client.create(todoRecord);
  console.log(`Created to-do ${newId}`);

  // fetch the new to-do
  const fetched = await client.get(newId);

  // check the fetched to-do matches the to-do we created
  if (fetched === null) {
    console.error(`${newId} is null despite us just creating it`);
  } else if (
    fetched.content !== todoRecord.content ||
    fetched.is_complete !== todoRecord.is_complete
  ) {
    console.error(`To-do ${newId} does not match what we inserted`);
  } else {
    console.log(`Created and fetched to-do ${newId} as expected`);
  }

  // delete the to-do
  const success = await client.delete(newId);
  if (!success) {
    console.error(`Delete failed for id ${newId}`);
  } else {
    console.log(`Delete success for id ${newId}`);
  }

  // check we can no longer fetch the deleted to-do
  const deletedRecord = await client.get(newId);

  if (deletedRecord !== null) {
    console.error(`Delete failed for id ${newId} - to-do still exists!`);
  } else {
    console.log(
      `As expected, was unable to get to-do ${newId} after deletion`,
    );
  }
}

if (import.meta.main) {
  await main();
}

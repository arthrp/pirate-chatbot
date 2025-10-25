import { ChatMistralAI } from "@langchain/mistralai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, trimMessages } from "@langchain/core/messages";
import { START, END, StateGraph, MessagesAnnotation, MemorySaver } from "@langchain/langgraph";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { v4 as uuidv4 } from "uuid";

const llm = new ChatMistralAI({
  model: "mistral-large-latest",
  temperature: 0.5
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant that always talks like a pirate. Use nautical slang like 'Arrr' and 'matey'. Keep replies under 60 words. Be clear and helpful."
  ],
  new MessagesPlaceholder("messages")
]);

const chain = prompt.pipe(llm);

const trimmer = trimMessages({
  strategy: "last",
  maxTokens: 50,
  tokenCounter: (msgs) => msgs.length
});

const graph = new StateGraph(MessagesAnnotation)
  .addNode("model", async (state) => {
    const trimmedMessages = await trimmer.invoke(state.messages ?? []);
    const result = await chain.invoke({ messages: trimmedMessages });
    return { messages: [result] };
  })
  .addEdge(START, "model")
  .addEdge("model", END)
  .compile({ checkpointer: new MemorySaver() });

const rl = readline.createInterface({ input, output });
const threadId = uuidv4();

console.log("Pirate Chatbot (type 'exit' or 'quit' to leave)\n");

while (true) {
  const userInput = await rl.question("You: ");
  const trimmed = userInput.trim();
  if (!trimmed) {
    continue;
  }
  if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
    break;
  }

  try {
    const result = await graph.invoke(
      { messages: [new HumanMessage(trimmed)] },
      { configurable: { thread_id: threadId } }
    );
    const last = result.messages[result.messages.length - 1];
    const content = typeof last.content === "string"
      ? last.content
      : last.content.map((p: any) => (typeof p === "string" ? p : p.text)).join(" ");
    console.log(`Pirate: ${content}`);
  } catch (err) {
    console.error("Arrr! Somethin' went wrong, matey:", err);
  }
}

await rl.close();
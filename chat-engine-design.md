# Technical Design: Agnostic Chat Engine Architecture (Option 3)

## 1. Objective
Extract the LLM interaction, session management, and state logic out of Vue components (e.g., `ChatBot.vue`) into a pure, framework-agnostic TypeScript core. This architecture will allow different UI presentations—such as a graphical Chat interface and a Terminal/CLI emulator component—to share the exact same underlying business logic without relying on Vue's reactivity system.

## 2. High-Level Architecture
We will use an **Event-Driven, Object-Oriented** architecture. The core logic will reside in pure TypeScript classes, communicating with the UI layer via events.

```text
      +---------------------+          +---------------------+
      |   GUI (ChatBot.vue) |          | TUI (CLI Emulator)  |
      +---------------------+          +---------------------+
                 |                               |
                 | (useChatEngine Bridge)        |
                 V                               V
      +------------------------------------------------------+
      |                  Vue Integration                     |
      +------------------------------------------------------+
                 | (Calls Methods)               ^ (Emits Events)
                 V                               |
      +------------------------------------------------------+
      |                   ChatEngine (Core)                  |
      |                                                      |
      |  +----------------+         +------------------+     |
      |  | Event Emitter  |         | StorageProvider  |     |
      |  +----------------+         +------------------+     |
      +------------------------------------------------------+
                                 |
                                 | (Uses)
                                 V
                       +-------------------+
                       |   GeminiClient    |
                       | (window.          |
                       |  LanguageModel)   |
                       +-------------------+
```

## 3. Core Components

### 3.1. `EventEmitter` (or `mitt`)
A lightweight pub/sub mechanism. The engine will emit events whenever the state changes (e.g., a message chunk is received, loading starts/stops), and the Vue components will listen to these events to update their local reactive state.

### 3.2. `StorageProvider`
Abstracts the persistence layer (`idb-keyval`). This ensures the core engine isn't tightly coupled to a specific storage implementation.
- `getSessions(): Promise<Session[]>`
- `saveSession(session: Session): Promise<void>`
- `deleteSession(sessionId: string): Promise<void>`
- `getMessages(sessionId: string): Promise<Message[]>`
- `saveMessages(sessionId: string, messages: Message[]): Promise<void>`
- `deleteMessages(sessionId: string): Promise<void>`

### 3.3. `GeminiClient`
Abstracts the Chrome `window.LanguageModel` API. It handles model availability, session creation, token tracking, and provides a clean streaming interface.
- `checkAvailability(): Promise<Status>`
- `promptStreaming(text: string, history: Message[]): AsyncGenerator<string>`
- `resetSession(): Promise<void>`

### 3.4. `ChatEngine` (The Facade)
The central class that orchestrates the workflow. UI components will instantiate or access an instance of this class.

**State:**
- `activeSessionId: string`
- `messages: Message[]`
- `isGenerating: boolean`

**Methods:**
- `loadSession(id: string): Promise<void>`
- `createNewSession(): Promise<string>`
- `deleteSession(id: string): Promise<void>`
- `sendMessage(content: string): Promise<void>`
- `abortGeneration(): void`

**Events Emitted:**
- `on('sessions:changed', (sessions: Session[]) => void)`
- `on('activeSession:changed', (sessionId: string) => void)`
- `on('messages:changed', (messages: Message[]) => void)`
- `on('generation:start', () => void)`
- `on('generation:chunk', (chunk: string, fullText: string) => void)`
- `on('generation:end', () => void)`
- `on('error', (err: Error) => void)`

## 4. Vue Integration (The Bridge)
To use this pure TypeScript class in Vue, we will create a thin "bridge" composable (e.g., `useChatEngine.ts`). This composable will instantiate the `ChatEngine`, subscribe to its events, and update Vue `ref`s so the UI can react to changes.

```typescript
// Example usage in a Vue component
import { useChatEngine } from '@/composables/useChatEngine';

const { messages, isLoading, sendMessage } = useChatEngine(engineInstance);

const onSubmit = () => {
  sendMessage(inputText.value);
};
```

## 5. Extensibility & Future-Proofing
- **Tool Calling:** When adding tool calls, the `ChatEngine` can intercept special structured responses from the `GeminiClient`, execute the tool logic (e.g., reading a local file), and then automatically feed the result back into `promptStreaming` without the UI needing to know.
- **Web Workers:** Because the core is pure TS and doesn't touch the DOM or Vue Reactivity, the `ChatEngine` (and the `window.LanguageModel` calls) can eventually be moved into a Web Worker. The `EventEmitter` would just serialize events over `postMessage`, keeping the main thread completely free from heavy string manipulation or state diffing.
- **CLI specific features:** The CLI might have special slash commands (e.g. `/clear`). The CLI Vue component can parse these and either handle them locally or call specific methods on the `ChatEngine`.

## 6. Implementation Steps
1. Create `src/core/types.ts` for domain interfaces (`Message`, `Session`).
2. Create `src/core/StorageProvider.ts` moving `idb-keyval` logic.
3. Create `src/core/GeminiClient.ts` migrating `useGeminiNano.ts` logic.
4. Create `src/core/ChatEngine.ts` to tie them together and implement event emitting.
5. Create `src/composables/useChatEngine.ts` (the bridge) to provide reactivity to Vue components.
6. Refactor `ChatBot.vue` and `ChatSidebar.vue` to use the new bridge.
7. Build the `CliEmulator.vue` utilizing the same bridge.

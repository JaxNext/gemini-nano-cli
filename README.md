# Gemini Nano Web IDE

A powerful, browser-based AI coding IDE that leverages Chrome's built-in Gemini Nano model to provide seamless, private, and fast AI assistance directly in your browser. 

## ✨ Features

- **Built-in AI (Gemini Nano)**: Zero-latency, fully private AI assistance using Chrome's on-device Gemini Nano model. No API keys required.
- **📂 Local Project Management**: Load and manage your local codebases securely through the File System Access API.
- **📝 Code Editor**: Fully featured in-browser code editor to display and edit your file contents with syntax highlighting.
- **🖼️ Multi-Modal Prompting**: Support for text and image inputs to help the AI understand your tasks better.
- **🛠️ Agentic Tool Calling**: Equip the AI with tools to search, analyze, and modify your code automatically.
- **💻 Terminal / CLI Mode**: Integrated command-line interface feel for executing commands and workflow scripts.

---

## 🗺️ Roadmap & Progress Tracking

Use this roadmap to plan, track, and record the development progress of the IDE. Check off the boxes as you complete each task.

### Phase 1: Foundation & UI
- [ ] Initialize the web application (e.g., using React, Vue, or Vanilla JS + Vite).
- [ ] Set up the UI layout (Sidebar for files, Main panel for editor, Bottom/Side panel for AI/CLI).
- [ ] Integrate a modern browser code editor (e.g., Monaco Editor or CodeMirror).
- [ ] Implement local directory access using the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API).
- [ ] Display the loaded project's file tree in the sidebar.
- [ ] Allow opening, editing, and saving files back to the local disk.

### Phase 2: AI Integration (Gemini Nano)
- [ ] Verify Chrome's Prompt API / built-in AI availability.
- [ ] Create an AI chat interface component.
- [ ] Connect the chat interface to the `window.ai` (Gemini Nano) API.
- [ ] Implement context-awareness: pass the currently open file or selected code to the prompt automatically.
- [ ] Handle streaming responses from the model for a snappy UI.

### Phase 3: Advanced AI Features 
- [ ] **Multi-Modal Support**: Add an upload/drag-and-drop mechanism for images in the chat. Extract image data and feed it to the model.
- [ ] **Tool Calling Setup**: Define the schema for tools (e.g., `read_file`, `search_codebase`).
- [ ] **Tool Execution**: Implement the logic to execute tool calls returned by the model and feed the results back into the conversation.
- [ ] **Code Diff Generation**: Allow the AI to suggest precise file edits and render them as a diff for user approval.

### Phase 4: CLI Mode & Polish
- [ ] Build the CLI mode UI component (a terminal-like interface).
- [ ] Parse and handle special CLI prompt formats or commands.
- [ ] Implement workspace-wide search (e.g., text search via regex).
- [ ] Add popular AI IDE features: inline code generation ("Cmd+K"), code explanation, and auto-complete snippets.
- [ ] Refine the design system for a premium, native IDE aesthetic.

---

## 🚀 Getting Started

*(Add instructions here on how to run the project locally once you start building it)*

```bash
# Example
npm install
npm run dev
```

## 🛠️ Technology Stack

*(Update this section to reflect the actual tech stack you choose for the project)*
- **Frontend Framework**: (e.g., React / Next.js / Vite)
- **Editor**: Monaco Editor
- **Styling**: Tailwind CSS / Vanilla CSS
- **AI**: Window AI API (Built-in Gemini Nano)

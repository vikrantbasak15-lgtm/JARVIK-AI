# JARVIK AI — feature guide

JARVIK is a browser-based AI workspace combining conversations, code previews, documents, data tools, voice controls, and agent workflows. This guide describes the features present in the current source; it is not a claim that every external integration has been tested with live accounts.

## 1. Chat and response controls

| Feature | What it does |
| --- | --- |
| Streaming chat | Displays a model's response as it arrives; Stop interrupts generation. |
| Multiple conversations | Creates, renames, searches, switches between, and deletes stored chats. |
| Message copy | Copies response text/Markdown; code blocks have their own copy controls. |
| Read aloud | Speaks a reply with the browser's available voices. |
| Retry and branches | Generates another answer to a prompt and lets you switch between versions. |
| Edit and resend | Changes a user message and submits the revised prompt. |
| Pins | Saves useful messages for later reference. |
| Delete | Removes a message after confirmation. |
| Compare | Sends a prompt to two model choices for side-by-side answers and text differences. |
| Rich replies | Renders Markdown, code highlighting, tables, mathematical notation and Mermaid diagrams when their supporting libraries are available. |
| Follow-up actions | Offers prompt suggestions, rewrite actions, audience changes, and reply metrics. |
| Thread search and timeline | Finds text within a long conversation and jumps to particular messages. |
| Prompt Library | Saves reusable prompts, including templates with `{{blanks}}` to fill. |
| Scratch Pad | Keeps quick working notes beside the conversation. |

## 2. Providers, models and personality

Provider settings include presets for OpenRouter, NVIDIA, OpenAI, Anthropic, Gemini, Groq, Together, Mistral, DeepSeek, Ollama, and custom endpoints. You can enter a key, base URL and model ID, and request a model list where the endpoint supports it. A preset does not guarantee that a listed model remains available or that the provider accepts browser-origin requests.

Settings also control temperature, output-token limits, top-p, system instructions and personas such as an architect, researcher, tutor or startup mentor. Code Mode changes the instructions toward complete implementations. Roast, Debate Me, Devil's Advocate and Gen-Z modes apply different conversational styles. Boost adds a reply-detail dial, tone choices, Hype mode and optional routing of code prompts to a selected model.

The Build-a-Model Lab changes a local simulated assistant's personality and rules. It is a rule-based offline demo: it does not train, fine-tune or run a real language model. Real local-model inference requires a separately running service such as Ollama.

## 3. Canvas and coding workspace

| Feature | What it does |
| --- | --- |
| Co-Work Canvas | Opens generated artifacts beside chat with preview, editable code and console views. |
| Artifact tabs and explorer | Organizes generated files, switches tabs and supports file naming and deletion. |
| Run and preview | Renders HTML/CSS/JavaScript previews; shows captured browser-console output. |
| Device widths | Checks the preview at phone, tablet and desktop widths. |
| Version comparison | Shows a basic line-by-line comparison of previous and current artifact code. |
| Canvas actions | Copies, downloads, opens a preview in another tab, expands fullscreen, or sends code back to chat. |
| In-app editor | Provides a VS Code-style file tree, folders, tabs, language modes and a terminal panel. It is a custom browser editor, not the full Microsoft VS Code application. |
| Starter projects | Creates starter files for small browser projects. |
| Terminal and JARVIK Shell | Supports built-in commands, file operations and JavaScript execution. It is not a system shell and cannot install or run arbitrary desktop programs. |
| JavaScript runner | Runs supported JavaScript in a worker with timeout handling. |
| Git-Lite | Stores named workspace snapshots, shows simple differences and restores saved file text. It does not perform Git commits or synchronize with GitHub. |
| Restore Points | Offers another local workspace snapshot/rollback mechanism through Settings. |
| ZIP export | Packages workspace files into a downloadable archive. |
| Element picker | Lets you select a preview element and request an AI-generated change. Applying a generated patch still needs review. |
| Console-error fix | Offers to send preview errors and code to the model, then replace and rerun the result. It does not guarantee a correct repair. |

Canvas templates include a landing page, dashboard, pricing page, résumé, Kanban board and Pomodoro timer. The generated template code is editable.

## 4. Documents, memory and research

- **Attachments:** brings text/code, images and supported documents into the workflow. Image understanding requires a suitable vision-capable model.
- **Project Knowledge:** stores reference text for use as model context.
- **Memory Panel:** keeps facts and preferences used to personalize prompts.
- **Memory Graph:** manages tagged facts and displays their relationships.
- **Smart Recall:** ranks chunks from stored sources using keyword-based BM25 retrieval and adds relevant context. It is not an embedding database.
- **Global Search:** searches across the local information sources assembled by the app.
- **Context Meter:** estimates prompt/context size; it is not a provider-authoritative token counter.
- **Summary Branches:** asks the model to condense a long chat into a short context capsule for a fresh conversation.
- **In-app Browser:** has tabs, navigation, bookmarks and an action to ask about a page. Some websites block embedding or cross-origin text access; an external-open action is provided.
- **URL reader and Web Agent:** fetch readable page text and use it for summaries/research. This is not unrestricted browser automation.
- **YouTube notes:** attempts to retrieve readable content/transcript text and turn it into notes. Extraction can fail; manual transcript input may be necessary.
- **Screenshot to context:** captures a user-selected screen/window for use in a prompt, subject to screen-sharing permission.

Local storage keeps copies in your browser. Sending a prompt, file excerpt or memory to an external AI provider transmits that content to that provider.

## 5. Data and learning tools

| Tool | What it does |
| --- | --- |
| CSV Insights | Parses CSV, shows basic numeric statistics, plots selected data and can request an AI narrative. It uses a limited sample rather than processing unlimited rows. |
| SQL Sandbox | Loads CSV into an in-browser SQLite database and runs SQL queries; an optional AI action drafts a query. The engine loads through sql.js. |
| Spreadsheet import | Uses SheetJS to convert supported Excel sheets into text/CSV-like knowledge content. It is not a full spreadsheet editor. |
| PDF to Data | Extracts readable PDF text and can ask the model for structured information. Scanned images may need OCR that is not supplied by this text-extraction path. |
| Doc Editor | Drafts and transforms text, with actions for rewriting, summarizing and titles. |
| Flashcards | Asks the model to generate question/answer cards, reveals answers and records self-assessed recall. |
| Regex Lab | Tests regular expressions against supplied text and shows matches/errors. |
| JSON tree | Presents JSON code blocks as expandable structures. |
| Codebase Q&A | Sends workspace excerpts to a model to answer questions about your files. |
| Code Review | Sends pasted changes or code to a model for review; it does not replace execution or security testing. |

## 6. Agents, comparisons and automation

Agent Studio offers 16 role prompts: planner, architect, researcher, coder, refactorer, tester, security reviewer, critic, documentation writer, data analyst, growth adviser, copywriter, interviewer, optimizer, translator/localizer and release manager. They are roles using your configured model, not 16 independently trained models.

- **Agent swarm:** runs selected roles against a shared goal and transcript. Tool instructions support saving a document, storing a memory or updating an open canvas.
- **Pipeline Builder:** saves an ordered sequence of agent roles and runs the workflow.
- **Command Composer:** supplies chains such as Research → Notes → Document, Reason → Critic → Improve, and Plan → Build → Test Plan.
- **Scheduled Agents / Scheduled Runs:** repeats stored tasks or prompts while the page remains open. Background throttling can delay them; they are not server-hosted jobs.
- **Task Queue:** collects tasks and processes them through the app's model workflows.
- **Morning Briefing:** builds a briefing using available local context and model output.
- **Debate Arena:** has model roles argue a topic and a judging role assess it.
- **Duel Arena:** supports comparing responses and voting on a preference.
- **Offline outbox:** queues certain failed requests for a later reconnect attempt. The cached UI is not offline model inference.

## 7. Voice, meetings and recording

Voice typing uses browser speech recognition. The voice HUD/orb adds listening, thinking, speaking, mute, interrupt, retry and exit controls. Auto Voice reads responses, with voice and speech-rate settings. Wake-word controls attempt hands-free activation through browser recognition.

Meeting Mode captures recognized microphone speech and asks a model to turn it into minutes, decisions and action items. It does not automatically capture every remote participant's audio. Podcast Mode reads chat in alternating browser voices. Demo Recorder uses browser screen recording to create a downloadable recording. These features depend on browser support and explicit microphone/screen permissions; speech recognition may use a browser-vendor service.

## 8. Collaboration

Team Rooms use PeerJS for room joining and invitations, participant presence, shared workspace/chat events and live cursors. Additional controls include role/persona assignment, a shared conversation context, room replay and team-voice transcript events. These need live network testing between peers; they are not a hosted enterprise collaboration backend.

Multi-tab co-edit uses BroadcastChannel to exchange edits between compatible tabs on the same origin. It is distinct from remote Team Rooms and is not a robust multi-user merge system.

## 9. Content and planning

Landing Forge requests an HTML landing page from a product brief. Content Forge drafts blog/social writing. Audience rewrite chips adapt text for different readers. Chat → Slides converts the latest response into an HTML presentation in Canvas; it does not produce a PowerPoint file.

The Sprint Roadmap turns work into steps and tracks progress. Profession Packs install starter memories, prompts and agent pipelines for a founder, student, designer or product manager. Image generation uses an external image service; availability and output quality depend on that service.

## 10. Appearance, navigation and engagement

Pitch Black is now the default. Other choices include muted dark blue, green, purple and orange, plus two light palettes. Sidebar, chat and top bar share the selected background. An existing saved theme remains selected until the user changes it.

The compact top bar, More menu, folding chat/composer controls, mobile sidebar, Focus Mode, command palette and slash commands provide different ways to reach tools. Common shortcuts include Ctrl/Cmd+K for commands and Ctrl/Cmd+. for focus mode; the app also provides editor/browser shortcuts and a cheat sheet.

Boost Hub exposes sound volume, accents, optional CRT styling, boot effects, cursor trails, reply notifications, voice-only display and other preferences. Skins change Boost accents/CRT settings; the Appearance picker controls the main workspace palette. Other optional presentation features include reactive reactor states, ripples, particles, parallax, a radial command wheel, activity wallpaper and a landing-page demo. The recent matte theme changes intentionally soften several glow effects.

Achievements, XP/levels, daily quests, starter prompts, greetings, nudges and a weekly-wins report provide activity-based engagement. They describe usage rather than proving productivity gains.

## 11. Exports, storage and installation

Export options include conversation Markdown, HTML, JSON, print-to-PDF, chat backups, artifact files, workspace ZIPs and selected share formats. Packs export/import collections of memories, documents, pipelines and other app state. Share-codes can carry pack data in a URL; Canvas blob links are local to the current browser context, not a published website.

Usage Analytics, Usage Pulse, Mission Trace and Cost Dashboard show recorded activity, latency and estimated tokens/cost. Estimates are not your provider's invoice. Browser storage can be cleared or fill up, so download backups for important work.

The service worker caches the app shell, and supported browsers may offer PWA installation. Optional CDN libraries, research services and cloud AI features still require a network connection. The Pro/license UI uses client-side checks and demonstration key logic; it is not secure payment processing, authentication or server-enforced licensing.

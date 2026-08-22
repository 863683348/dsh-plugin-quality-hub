# dsh-chat-import: bring 13 coding agents' chats in

<!-- CONFIG -->

## What this plugin does

dsh-chat-import is a session-type plugin for DSH (DeepSeek Harness). It reads conversation logs that thirteen different coding agents have written to disk and turns them into ordinary DSH sessions that you can open and continue. The point is not just to display old chats. The point is to rebuild them well enough that the agent running inside DSH can pick up where the old agent left off, without you retyping the whole context.

A session in DSH is a conversation thread with an agent. Session-type plugins are allowed to read, rebuild, and import conversations, which is exactly the capability this plugin leans on. Most plugins add a UI panel or a slash command. This one adds a reader pipeline. It registers a service, walks a foreign storage format, normalizes the messages, and hands the result to DSH's session service so the thread appears in your session list next to threads you started natively.

I built the habit of switching agents whenever a project hits a wall. The cost of that habit used to be the loss of every prior conversation. dsh-chat-import is the tool I wished I had earlier. It treats the migration as a data problem instead of an excuse to start over.

## The problem it solves

Coding agents do not agree on how to store a conversation. Claude Code appends JSONL. Cursor packs SQLite blobs. Aider writes markdown. Cline and Roo Code keep per task JSON. Continue and Windsurf and Zed keep SQLite. When you leave one agent for another, your history stays locked in a format only the original tool can read. If you spent three weeks coaxing an agent through a tricky refactor, that reasoning dies the moment you open a different tool.

The deeper problem is that these logs are not just text. They carry tool calls, file edits, branch state, thinking blocks, and attachments. A naive copy paste loses all of that. dsh-chat-import tries to preserve as much structure as the source format allows and to record, honestly, what it had to drop. The output is a resumable DSH session, not a screenshot of a dead chat.

## Who it is for

This plugin is for people who have real working history in another agent and do not want to throw it away. That includes engineers migrating from Claude Code to DSH, consultants who were handed a Cursor project and need to understand the reasoning behind it, researchers archiving how an agent solved a particular bug, and anyone who refuses to lose a long thread because a vendor changed its storage layout.

It is also a teaching example. The plugin ships one reader per agent, and reading those readers is the fastest way to learn how session-type plugins deal with foreign formats. Each reader is small and isolated. You can copy one as a starting point for the fourteenth agent you care about.

## Install and config

DSH loads plugins through the Cordis runtime. You can install dsh-chat-import from the plugin panel at http://127.0.0.1:3080, or you can drop the plugin folder into your DSH plugins directory and restart the server. The plugin registers a service named chatImport and a command group named chat-import. After install you configure it through the plugin settings panel or through the DSH config file.

A minimal config looks like this:

```yaml
plugins:
  dsh-chat-import:
    enabled: true
    sources:
      claude-code:
        enabled: true
        root: ~/.claude/projects
      cursor:
        enabled: true
        workspaceStorage: ~/.cursor/User/workspaceStorage
    defaults:
      model: deepseek-chat
      adapter: openai-compat
      skipSystemPrompts: true
      maxMessages: 0
    fidelity:
      keepToolCalls: true
      keepAttachments: false
      keepThinking: partial
```

The sources block is the part you actually touch. Each agent has its own sub block with a path to where it stores data on disk. The defaults block controls what happens when an imported session is resumed. skipSystemPrompts tells the importer to drop the source agent's own system prompt, because DSH supplies its own when the session opens. maxMessages set to 0 means no limit, import the whole thread. fidelity controls how aggressively the importer keeps tool calls, attachments, and thinking blocks.

Cordis plugins declare their shape through a manifest. The manifest for this plugin is short:

```json
{
  "name": "dsh-chat-import",
  "version": "0.4.2",
  "cordis": {
    "services": ["chatImport"]
  },
  "peerDependencies": {
    "cordis": "^3.0.0"
  }
}
```

The services array is what lets other plugins depend on chatImport if they want to build on top of the import pipeline. DSH itself does not need to know about the individual agents. It only needs the normalized session document at the end.

## Supported agents

The plugin currently knows how to read thirteen agents. The list is below with the storage format each one uses.

1. Claude Code. JSONL transcripts under ~/.claude/projects, one file per conversation, each line an event object.
2. Codex CLI. JSONL session files under ~/.config/codex/sessions.
3. Aider. A markdown transcript plus a JSON history file written next to your repository.
4. Cursor. A SQLite database named state.vscdb inside each workspace storage folder.
5. Cline. Per task JSON under the VS Code globalStorage directory, plus an API conversation history file per task.
6. Continue. A SQLite sessions database under ~/.continue, or JSON files in older builds.
7. GitHub Copilot Chat. SQLite global storage inside the VS Code user data, chat blobs stored as JSON.
8. Gemini CLI. JSONL session files under ~/.gemini.
9. OpenCode. JSONL session files under its config directory.
10. Roo Code. Per task JSON under globalStorage, the same shape as Cline.
11. Windsurf. A SQLite conversation store under the Codeium data directory.
12. Qwen Code. JSONL session files under ~/.qwen, close to the Gemini CLI layout.
13. Zed. A SQLite thread database under the Zed data directory.

The mix is the interesting part. Seven of these are JSON or JSONL. Four are SQLite. One is markdown. The importer handles them with three reader classes. One reader handles line delimited JSON. One handles SQLite with a known schema. One handles the Aider markdown format. Adding a fourteenth agent usually means writing one small adapter that returns raw message records, then letting the shared normalizer do the rest.

## How session import works

The import pipeline has five stages. First, a locator finds the store for a given source and lists candidate conversation files. Second, a reader opens each file and yields raw message records in the order they were written. Third, a normalizer maps each record into DSH's canonical message shape. Fourth, a builder assembles the messages into a session document and attaches provenance metadata. Fifth, a writer persists the session through DSH's session service so it shows up in the session list.

The canonical DSH session document looks like this:

```json
{
  "id": "sess_8f2c1a",
  "title": "refactor auth middleware",
  "agentId": "dsh-chat-import",
  "model": "deepseek-chat",
  "createdAt": "2026-03-14T09:21:00Z",
  "updatedAt": "2026-03-21T17:02:00Z",
  "messages": [
    {
      "role": "user",
      "content": "split the auth check into a middleware",
      "parts": [
        { "type": "text", "text": "split the auth check into a middleware" }
      ],
      "ts": 1710408060
    },
    {
      "role": "assistant",
      "content": "I will move the guard into middleware/auth.ts",
      "toolCalls": [
        { "id": "t1", "name": "edit_file", "input": { "path": "src/middleware/auth.ts" } }
      ],
      "ts": 1710408081
    }
  ],
  "attachments": [],
  "meta": {
    "source": "claude-code",
    "sourcePath": "/home/me/.claude/projects/-repo/uuid.jsonl",
    "originalModel": "claude-opus-4",
    "importedAt": "2026-04-02T11:00:00Z",
    "fidelity": { "toolCalls": true, "attachments": false, "thinking": "partial" }
  }
}
```

The messages array is the heart of the document. DSH renders it, and when you resume, DSH sends it to the model adapter as the conversation history. The meta block carries provenance so you can trace every imported session back to its origin file. The fidelity block is honest about what was lost during the conversion.

Resumability depends on the model adapter. DSH talks to models through adapters that follow the OpenAI chat completions request shape. When you open an imported session, DSH loads the messages, prepends its own system prompt, and calls the adapter. The agent sees the prior turns as history and can continue the work. It does not need to know the conversation originated in Claude Code or Cursor. The only thing it cannot recover is the exact local file state the old agent saw, because that state lives in your working tree, not in the log.

<!-- CODE -->

## Commands and example flows

The plugin exposes a command group through the Cordis command service, and the same commands are available from a UI panel in the DSH web interface. The CLI style commands are convenient when you are migrating a whole machine full of history.

List the agents the plugin can read on this machine:

```bash
dsh chat-import list-sources
```

Preview what a source would import without writing anything:

```bash
dsh chat-import preview --source cursor --db ~/.cursor/User/workspaceStorage/abc123/state.vscdb
```

Run an import for one source and write the sessions:

```bash
dsh chat-import run --source claude-code --path ~/.claude/projects
```

Resume an imported session from the DSH session list, or from the command line:

```bash
dsh chat-import resume sess_8f2c1a
```

The preview command is the one I use most. It prints the number of conversations found, the number of messages each would produce, and a per conversation fidelity estimate. That estimate tells you up front whether a thread is worth importing or whether too much would be lost.

## Per agent reading notes

Each agent stores chats differently, and the normalizer has to account for those differences. The notes below describe what the reader does for each source.

Claude Code writes one JSONL file per conversation under ~/.claude/projects. The directory name is the project path with slashes replaced by dashes. Each line is an event with a type field. The types of interest are summary, user, assistant, and tool_result. The user and assistant events carry a message object. Content can be a plain string or an array of content blocks. Text blocks have type text. Tool use blocks have type tool_use with an id, a name, and an input object. Tool result blocks have type tool_result with a tool_use_id and content. The reader walks each line, rehydrates the tool_use and tool_result pairs by matching ids, and emits one DSH message per assistant turn with its tool calls attached. Claude Code also writes a summary event near the end. The reader uses that summary as the imported session title when no better title exists.

Codex CLI keeps JSONL session files under ~/.config/codex/sessions. Each line is a message with a role and a content string, and tool calls appear as separate structured records. The layout is simpler than Claude Code because Codex keeps a flat message list. The reader maps role directly and converts tool call records into DSH toolCalls on the preceding assistant message.

Aider is the odd one. It writes a markdown transcript named .aider.chat.history.md in your project, with user turns and assistant turns separated by headings, and it also writes aider.history, a JSON file with the raw message list including edit events. The markdown is human readable but lossy because Aider renders tool output as prose. The reader prefers aider.history when present, because it preserves the structured edits, and falls back to the markdown only when the JSON is missing.

Cursor stores chat history in state.vscdb, a SQLite database inside each workspace storage folder under ~/.cursor/User/workspaceStorage. The relevant table is an key value store, often named cursorDiskKV or similar, holding large JSON blobs. One blob contains the composer or chat conversation as an array of messages. The reader opens the SQLite file, queries the key value table for the chat keys, parses the JSON, and flattens the message array. Cursor nests content in a content field that may itself be an array of typed parts, so the reader has to descend two levels to find the actual text and tool call objects.

Cline keeps a task list under the VS Code globalStorage directory, typically ~/.vscode/globalStorage/saoudrizwan.cline-0.x.x/tasks. Each task is a folder with api_conversation_history.json, an array of {role, content} pairs, and a cline_messages.json with the richer event log including tool executions and file writes. The reader uses api_conversation_history.json for the clean message stream and cross references cline_messages.json to recover tool call names and their inputs. Content in Cline is frequently a string that embeds XML style tool tags, so the reader has a small parser that lifts those tags into structured toolCalls.

Continue has changed its storage across versions. Older builds wrote one JSON file per session under ~/.continue/sessions. Newer builds use a SQLite database named sessions.sqlite with a sessions table and a steps or messages table. The reader detects which one exists, and if it finds SQLite, it joins sessions to their steps and reconstructs the message order from the step index. Continue messages carry a role and a list of message parts, where parts can be text, code, or tool call results, so the reader maps each part type into the DSH parts array.

GitHub Copilot Chat stores its history inside the VS Code user data SQLite files, in globalStorage under a key that holds a JSON array of chat sessions. The reader locates the Copilot extension storage, reads the SQLite key value store, and parses the chat session array. Copilot messages use a role field and a content array of typed blocks, including code blocks and tool invocation blocks. The reader maps those blocks and notes that Copilot sometimes stores the user's message as a prompt field rather than content, which the normalizer handles as a special case.

Gemini CLI writes JSONL session files under ~/.gemini, with each line a message object carrying role and parts. Parts are typed, and the thinking or reasoning content appears as a separate part with type thought. The reader lifts thoughts into the thinking field of the message and keeps them only when fidelity.keepThinking is not false. Gemini also stores the model name per message, which the reader records in meta.originalModel when it is consistent across the thread.

OpenCode is a Go based agent that writes JSONL session files under its config directory, usually ~/.config/opencode/sessions. Each line is a message with role, content, and optional tool calls. The layout is close to Codex, and the reader shares most of its logic with the Codex reader through a common line delimited JSON base class.

Roo Code is a fork of Cline, and its storage mirrors Cline almost exactly under the globalStorage key rooveterinaryinc.roo-cline. The reader reuses the Cline reader with a different base path and a different task folder naming convention. The message history file is api_conversation_history.json, and the richer log is roo_code_messages.json.

Windsurf keeps Cascade conversations in a SQLite store under the Codeium data directory. The schema holds a conversations table and a messages table joined by conversation id. The reader opens the SQLite file, selects messages ordered by an internal sequence, and rebuilds each conversation. Windsurf messages carry a role and a content array, and tool calls appear as structured action objects that the reader maps into DSH toolCalls.

Qwen Code is built from the Gemini CLI lineage and writes JSONL under ~/.qwen with the same parts layout. The reader reuses the Gemini reader. The only difference worth noting is that Qwen sometimes stores reasoning under a reasoning field instead of a thought part, so the reader checks both locations.

Zed stores assistant threads in a SQLite database under its data directory, with a threads table and a messages table. Zed messages are JSON objects with role and content, and Zed keeps a separate table for tool uses linked by message id. The reader joins messages to their tool uses and reconstructs the order from the message timestamp and sequence. Zed content is plain text or a structured block list, and the reader maps both.

## Example import flows

A simple flow imports every Claude Code project on the machine:

```bash
dsh chat-import run --source claude-code
```

The importer scans ~/.claude/projects, finds every JSONL file, normalizes each, and writes one DSH session per file. If two files share a project, they become two separate sessions with the project path recorded in meta.

A targeted flow imports a single Cursor workspace:

```bash
dsh chat-import run --source cursor --db ~/.cursor/User/workspaceStorage/abc123/state.vscdb --title "Q2 billing refactor"
```

Here the operator overrides the session title instead of letting the importer guess from the first user message. The resulting session carries the supplied title and the source path in meta.

A batched flow imports everything the plugin can find, then reports a summary:

```bash
dsh chat-import run --all --report import-2026-04-02.json
```

The --all flag iterates every enabled source in the config. The --report flag writes a JSON file listing each imported session, its source, its message count, and its fidelity block. That report is the audit trail. When a session later looks wrong, you open the report and see exactly what the importer captured.

A resumability check flow verifies that an imported session can be loaded by the adapter:

```bash
dsh chat-import verify sess_8f2c1a --adapter openai-compat
```

verify builds the request DSH would send to the model, checks that every message has a supported role, and confirms the total token estimate is within the adapter's context window. It does not call the model. It only validates the shape.

## Mapping rules the normalizer applies

The normalizer is where most of the fidelity decisions live. It applies a fixed set of rules regardless of source.

Role mapping. DSH uses user, assistant, system, and tool. Most agents map cleanly. Aider's edit events become assistant messages with a tool call. Cursor and Copilot tool result blocks become tool messages keyed by the originating tool call id. If a source has no concept of a tool message, the normalizer folds the tool output into the preceding assistant message as a note.

Content blocks. DSH stores content as both a flat string and a parts array. The flat string is for rendering. The parts array is for structure. The normalizer always populates parts from the source's typed blocks, then derives the flat string by concatenating the text parts. That keeps the rendered view readable while preserving the structure for resumption.

Tool calls. When a source records a tool call with a name and an input object, the normalizer keeps both. When a source only records the tool output, the normalizer records the output under toolResults with a synthetic id and marks fidelity.toolCalls as partial. This is the most common fidelity loss, because several agents log the result without reliably logging the request.

Timestamps. Sources store times in different shapes, Unix seconds, ISO strings, or local human readable text. The normalizer converts everything to Unix seconds in UTC and stores that as ts. It does not try to recover sub second precision that the source did not keep.

Model. The normalizer records the source model in meta.originalModel. It does not force that model onto the imported session, because DSH resumes with the model configured in defaults.model. The original model is provenance, not a constraint.

Attachments. Images, PDFs, and uploaded files are the hardest to recover. Most agents store attachments as references or as opaque blobs that do not survive a copy. The normalizer keeps attachment references only when the source stores them as resolvable paths on the same machine. Otherwise it drops them and marks fidelity.attachments as false.

<!-- HIGHLIGHTS -->

## Key takeaways

The big lesson from this plugin is that conversation history is recoverable if you treat it as structured data rather than text. Every agent on the list writes a log with a predictable shape, even when that shape is hidden inside SQLite or markdown. Once you locate the store and parse it, the messages are surprisingly portable.

The second takeaway is that resumability and fidelity are different goals. A session can be perfectly resumable while having lost every tool call, because DSH only needs the message text to continue the conversation. Fidelity is about how much of the original reasoning survives. The plugin separates the two and reports both.

The third takeaway is that provenance matters more than people expect. When an imported session produces a wrong answer six weeks later, you want to know it came from a Cursor chat where tool calls were dropped, not from a Claude Code chat with full fidelity. The meta block is the difference between a mystery and an explanation.

## Gotchas

Format mismatches are the first trap. Agents name roles differently. Some use "function" for tool messages. Some nest content two levels deep. Some store the user turn as a prompt field. The normalizer handles the common cases, but a new agent version can rename a field and break a reader overnight. The preview command exists to catch that before you write sessions.

Lost context is the second trap, and it is the one users feel most. A tool result that says "edited src/auth.ts, 14 lines changed" tells the new agent what happened but not the resulting file contents. When you resume, the agent does not have the diff in its context. It has only the note. For short threads this is fine. For a long refactor it can mean the agent re derives work it already did.

Token cost is the third trap. Importing a 200k token transcript and then resuming re sends that 200k tokens to the model on the first reply. DSH estimates the cost in the verify step, but the estimate surprises people. A setting in defaults, maxMessages, lets you cap the imported tail so you keep the recent context without paying to resend the entire history. Set it to a few hundred messages if token budget matters.

Thinking and reasoning blocks are the fourth trap. Several agents keep a private reasoning trace that is not part of the visible message. The plugin can import it only when the source exposes it, and even then it inflates the token count. The default is partial, which imports reasoning only when it is clearly separated from the answer. Set keepThinking to false if you want lean sessions.

Attachments are the fifth trap. Images and uploaded files rarely survive the move, because agents store them as blobs or temporary paths. The importer drops them and tells you it dropped them. Do not expect an imported session to "remember" a screenshot you pasted into Cursor.

Local state is the sixth trap, and it is unavoidable. A session that says "run the tests" made sense in the old agent's working tree at a specific commit. After import, the working tree may have moved on. The conversation is portable. The filesystem is not.

## Lessons on reading foreign storage formats

The first lesson for anyone writing a session-type plugin is to separate locating from reading. A locator returns a list of files or database keys. A reader consumes one of those and yields records. Keeping them apart means you can test the reader against a saved sample without needing the whole agent installed.

The second lesson is to prefer streaming parses for line delimited JSON. You do not need the whole file in memory to import a 50MB Claude Code transcript. Read it line by line, parse each event, and emit messages as you go. The SQLite readers need a different approach because the interesting data is one large JSON blob, but even there you parse the blob once and stream the resulting array.

The third lesson is to never trust the source schema beyond what you assert. Every reader opens with a small validation step that checks the expected top level fields exist. If they do not, the reader skips that conversation and logs why, instead of throwing and aborting the whole import. Partial success beats a hard failure when you are migrating hundreds of threads.

The fourth lesson is to keep provenance on every record. The meta block is not decoration. It is what lets you answer "where did this come from" after the fact. Store the source name, the source path, the original model, and the import time on every session, and store the original role and any source specific id on every message when you have it.

The fifth lesson is to make import idempotent. The writer keys sessions by a hash of the source path and the conversation id, so running the same import twice does not create duplicates. It updates the existing session instead. This matters because people run --all repeatedly as they tune the config, and they should not end up with ten copies of the same chat.

The sixth lesson is to record failure as data. When the normalizer drops a tool call or an attachment, it writes that into the fidelity block rather than silently omitting it. A session that lies about its completeness is worse than one that admits its gaps. The fidelity block is the contract between the importer and the person resuming the session.

The seventh lesson is that SQLite is just JSON wearing a different coat. Four of the thirteen agents hide their chats in SQLite, but in every case the valuable data is a JSON string stored under a key or in a row. The hard part is finding which key or table. Once you have the JSON, you are back in the same normalization path as the JSONL agents. The SQLite reader is mostly a locator for the right row.

The eighth lesson is to respect the user's machine. An import should never write outside the DSH session store, never delete the source files, and never require network access. The plugin reads, transforms, and writes sessions. It does not phone home, and it does not mutate the agent directories it reads from. That restraint is what makes it safe to point at a live ~/.claude/projects while Claude Code is still running.

The ninth lesson is that titles are a UX problem, not a data problem. Agents name conversations inconsistently, if at all. The plugin guesses a title from the first user message, falls back to a source summary event, and finally falls back to the file name. None of these are perfect. The resume command lets you override the title, and most people do, because a session list full of "Untitled" is unusable.

The tenth lesson is that the value compounds. The first import saves one thread. The hundredth import builds an archive of how you actually solved problems across a year and four different agents. Because every session shares the same DSH schema, you can search them, resume them, and compare them regardless of where they started. That uniformity is the real output of the plugin, more than any single chat it recovers.

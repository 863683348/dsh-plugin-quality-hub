<!-- CONFIG -->

## What you are configuring

OpenViking is not a dsh plugin in the usual sense. It is a context database with its own server, its own client SDK, and a URI scheme that looks like a file system. The comparison with dsh-memory-evolve is the point of this pair of writeups, so I will keep that contrast running through the sections.

Installing OpenViking means setting up two things: the server that stores and indexes the context, and a client that talks to it. The server is the heavy part. It needs a working vector index, and in the reference deployment that index is backed by VikingDB, the vector database from the same team. The client is a small library in your agent's language. The Python client is the one documented most thoroughly, and it is what I used.

## Starting the server

The official README points to the project page at openviking.ai for the current start commands, and the exact invocation changes between releases. A typical path is to run the server through Docker or a compose file in the repo root, then point your client at it. The minimal check that the server is up is a health request against its port.

On my setup, the compose file in the repo root brings up the API and the index together. The server reads its settings from environment variables or a settings file, and the two values I had to set were the embedding endpoint and the rerank toggle. The health check is a simple GET against the root path, and it returns a JSON body with a status field. I put this check into a shell alias so I can confirm the store is alive before starting any agent work.

You will need an embedding model for the server to index new content. The reference setup integrates the Doubao embedding and rerank models, which is convenient because it means you do not assemble a separate embedding pipeline yourself. If you prefer a different provider, the server supports pointing at an OpenAI-compatible endpoint, and the config for that lives in the server settings file.

## A first run walkthrough

The first run is where most setup confusion shows up, so a walkthrough helps. I start the server, then run a three-step script.

First, confirm the server answers. A request against the root path returns a JSON status. Second, seed one document. I write a short runbook under the runbooks directory and call upsert. Third, search for it. I run find with the same anchor and a query that paraphrases the content. If the seeded document comes back with a nonzero score, the whole pipeline works: server, index, embedding, retrieval.

If the seeded document does not come back, the pipeline is broken somewhere between write and search. The trajectory view shows whether the write reached the index at all. In my case the first failure was an embedding endpoint misconfiguration. The server accepted the document, but every search came back empty, because nothing had been embedded. The fix was a settings file value, and the retest took one minute.

The whole walkthrough is under five minutes once the server is running, and it is the difference between trusting the setup and guessing at it. I keep the three-step script in a file next to the seed data, so a fresh machine can be validated in the same order.

## The URI scheme

The thing that makes OpenViking different is that all context is organized as URIs under a small set of top-level namespaces. The layout looks like this:

```
viking://memories/session-001/chat-history
viking://resources/runbooks/payment-service-incident
viking://skills/prometheus-query
```

Three namespaces: memories for session and long-term agent context, resources for knowledge base content, and skills for reusable procedures. Memories are where per-session and long-term agent context accumulates. Resources are the knowledge base, the documents and runbooks and specs the agent should be able to find. Skills are the how-to steps that should apply consistently. The three namespaces are not enforced hard walls. The value is organizational, and it gives both the agent and a human the same mental map.

Each entry has a path, and paths nest like directories. An agent does not search the whole store on every query. It starts at a directory, then does semantic search inside that directory. That is the design that classic RAG gets wrong, and it is the reason the store is worth configuring carefully.

## Client configuration

The Python client is configured with the server address and, depending on your deployment, a token. A minimal script that connects and searches looks like this:

```python
import viking

client = viking.Client(base_url="http://localhost:8000", token=os.getenv("VIKING_TOKEN"))

root_uri = "viking://resources/runbooks"
results = client.find("how to handle a payment timeout", target_uri=root_uri)

for r in results.resources:
    print(f"{r.uri} (score: {r.score:.4f})")

client.close()
```

The `find` call takes a natural language query and a `target_uri`. The `target_uri` is the directory anchor, and the score on each result tells you how relevant the match is. This is the operation you will call most often, and it is the direct answer to the fragmentation problem that flat RAG has.

## Tiered loading config

The most interesting part of the configuration is the tiered context loading, the L0/L1/L2 design. Each stored document has three representations: a short summary (L0), a structured overview (L1), and the full text (L2). The client decides how deep to load based on the task.

In practice you configure how aggressively the agent should climb the tiers. For a cheap triage pass, L0 only. For detailed work, L2. The reason this matters is token cost. A runbook that is several thousand words can be skipped at L0 for a quick relevance check, and only fully loaded when the agent actually needs the detail. I keep the default tier behavior and only force L2 for the narrow set of files where I know precision matters.

## Directory recursive retrieval

Configuration also covers how deep the search digs. Directory recursive retrieval means a search anchored at `viking://resources` descends through subdirectories, while a search anchored at a leaf directory stays narrow. This is the knob to turn when results feel too scattered or too narrow. I anchor at the broadest directory that still belongs to the task, and only narrow when broad results start pulling in unrelated content.

Anchor selection is the main tuning habit. I start every task by choosing the narrowest directory that still contains the answer, and I widen only when results come back empty. Too broad an anchor pulls in unrelated content and buries the good hit under the rerank. Too narrow an anchor returns nothing at all. The trajectory view makes this feedback loop fast, because you see exactly which directory the search visited.

## Tuning retrieval quality

Retrieval quality is not a single knob. It is the interaction of the anchor, the recursive flag, and the rerank toggle.

Start with the anchor. A too-narrow anchor returns nothing, and a too-wide anchor buries good hits under unrelated ones. The trajectory makes this visible, so tuning is a short loop: run, look at which directories the search visited, widen or narrow, rerun.

The rerank toggle matters more as the store grows. Without rerank, ordering follows raw embedding distance, which is fine for a small store and noisy for a large one. With rerank, the model reorders the top candidates, and the result order matches human judgment more closely. The cost is a small latency increase. I turn rerank on once a store passes a few hundred documents, and I have not wanted it off since.

The third lever is the L0 summary quality. The server generates summaries at write time with the configured model. A good summary makes the triage pass accurate, so documents are skipped for the right reason. When I write a resource by hand, I fill the summary myself, because I know which detail the retrieval should latch onto.

## Automatic session management

The server keeps session state, which is what makes long-horizon tasks work. A session's chat history lives under `viking://memories/session-001/chat-history`, and the server manages the lifecycle. The practical effect is that the agent can resume context across turns without the caller stitching together the transcript by hand. For a memory comparison, this is the centralized answer to the same problem the local plugin solves with files.

## Why centralized beats local in some cases

With OpenViking, the memory is not a set of Markdown files in your workspace. It is a store on a server, shared and queryable by anything that connects. That has real advantages for teams: multiple agents can read the same knowledge base, retrieval is semantic rather than linear, and the store scales past what a folder of files can manage.

The tradeoff is operational. A server is something to run, monitor, and back up. An embedding pipeline is something to pay for and keep healthy. For a solo developer who wants context to follow them between machines, the local file approach is lighter. For a team that needs one shared knowledge base with semantic retrieval, the server is the right shape.

## Wiring it into your agent

The client is not tied to Python. The protocol is HTTP, so any harness that can make a request can use the store. In my dsh setup I exposed the store to the agent through a small integration, and the configuration reduced to three environment values:

```
VIKING_BASE_URL=http://localhost:8000
VIKING_TOKEN=<issued token>
VIKING_DEFAULT_ANCHOR=viking://resources
```

The default anchor matters, because it decides where unanchored searches land. Set it to the broadest namespace your agent is allowed to read. Narrow it later if the agent starts pulling content it should not see.

Seeding the store is the other half of setup. An empty store returns nothing, which confuses the first session. I seed resources from the existing docs with a batch upsert, then run one test find to confirm the index responds. The seed step is where most "nothing works" reports actually begin, an empty store, not a broken one.

## Scaling and backups

The store is meant to hold more than a local tree of files. Backups are server backups, not file copies. If you self-host, snapshot the index and export the resources periodically. If you use the managed backend, the operator handles durability. Decide which side you are on before you store anything you would be sad to lose, because the two paths have very different backup stories. I schedule a nightly export of the resources namespace to a plain JSON file, which is cheap insurance against a bad index or a mistaken bulk delete.

## Config checklist

Before you consider the setup done, check these in order. The server responds to a health request. The client connects with the right base URL and token. A seed document writes and comes back in a search. The tiered load returns L0 before L2 when you ask for the shallow tier. Session state survives a reconnect. Each of these is a five-minute check, and together they catch the usual configuration mistakes before they bite.

<!-- CODE -->

## Reading OpenViking as code

OpenViking is a server, so "the code" is spread across a few layers: how the client writes context, how the server indexes it, how a search descends the URI tree, and how the agent decides which tier to load. I will trace the parts you actually touch as a developer, then show the integration layer you would write if you were building it into a dsh-style agent.

A note on framing first. The full server source is large, and the team keeps it moving. What matters for this writeup is the contract you code against, the URI scheme and the find call, and that contract is stable enough to build on.

## The write path

Writing context into the store is the first operation to understand. A resource is written to a URI, and the server indexes it for semantic search at the same time.

```python
import viking

client = viking.Client(base_url="http://localhost:8000")

runbook = viking.Resource(
    uri="viking://resources/runbooks/payment-timeout",
    content=text_of_runbook,
    summary="Troubleshooting steps for payment timeouts",
)
client.upsert(runbook)
```

The `upsert` is idempotent in the good sense. Re-running it with the same URI updates the resource instead of duplicating it. That is the property you want in a context store, because agents naturally rewrite and refine knowledge over time. The `summary` field feeds the L0 tier, which means you are deciding, at write time, what a cheap relevance check will see later.

The URI is not decoration. The path is the primary addressing mechanism. Writing to `viking://resources/runbooks/...` versus `viking://memories/...` is not a naming choice. It changes which namespace and which retrieval behavior applies.

## The find path

Retrieval is one call, and the directory anchor is what keeps it sane. Search inside a leaf directory stays narrow. Search at a parent directory descends.

```python
results = client.find(
    "payment gateway returns 502 after retries",
    target_uri="viking://resources/runbooks",
    recursive=True,
)
```

The `recursive=True` flag turns on directory recursive retrieval. With it, the search walks the subdirectories under `runbooks` and merges the semantic hits. Without it, only resources directly under the anchor are candidates. This is the knob that answers the classic RAG complaint of searching for the right thing and getting the wrong fragments.

Each result carries a score. In the reference implementation that score comes from the embedding distance, optionally refined by a rerank model. The rerank step is worth enabling if your store is large, because it costs a little latency and buys noticeably better ordering. The config for that lives in the server settings, not the client.

## Tiered loading, L0 to L2

The three-tier design is where OpenViking stops behaving like a typical vector store and starts behaving like a file system with summaries. The agent checks the summary first, then decides how deep to go.

```python
def load_document(client, uri, tier):
    if tier == "L0":
        return client.read(uri, level=0)   # summary only
    if tier == "L1":
        return client.read(uri, level=1)   # structured overview
    return client.read(uri, level=2)       # full text
```

The agent-side policy decides the tier. A cheap triage pass reads L0 for every candidate, keeps the ones whose summaries look relevant, and only then reads L1 or L2 for the survivors. I have used this on a support-oriented knowledge base, and the effect on token spend was the reason I kept the tool. Documents that would have been read in full, several thousand tokens each, got skipped on the summary alone.

The server computes the L0 summary and the L1 structure at write time using the configured model. That means the tiered view is not a retrieval-time trick, it is part of the stored document.

## The dsh integration layer

Now the part that connects this to the rest of the site's content: how you would expose OpenViking through a dsh-style plugin. The plugin exports an apply function and wraps the viking client. I wrote a small integration like this for an internal agent:

```ts
import { Client } from "@openviking/client";
import type { Ctx } from "@deepseek-ai/dsh";

export default async function apply(ctx: Ctx, config: VikingConfig) {
  const client = new Client({ baseUrl: config.baseUrl, token: config.token });
  ctx.on("session:create", async (session) => {
    const memory = await client.find(
      buildQuery(session.intent),
      { targetUri: "viking://memories", recursive: true }
    );
    const block = await Promise.all(
      memory.slice(0, config.topK).map((hit) =>
        client.read(hit.uri, { level: config.tier ?? "L1" })
      )
    );
    ctx.attachMemory(block, { maxTokens: config.maxTokens });
  });
}
```

The shape should look familiar, because it is the same lifecycle as the local memory plugin. Session start triggers a read, the read becomes an attached memory block, and the block is prepended to the conversation. The difference is where the data lives and how it is retrieved. Here the read is a semantic search against a shared server, not a file read from a local branch.

The `ctx.attachMemory` name is illustrative, as is the client import path. The exact package and hook names depend on your harness version. The structure is the transferable part: write and read are separate, and retrieval is anchored and tiered.

## Session management

Sessions are a first-class object on the server. A chat history lives at a memory URI, and the server tracks it. This removes the need for the caller to reconstruct context from a raw transcript.

```python
session = client.create_session("support-ticket-4821")
client.append(session.uri, "user: the gateway is returning 502")
state = client.session_state(session.uri)
```

The automatic session management shows up when an agent task spans many turns. Each turn's context is stored under the session URI, and a reconnect picks up where the session left off. For the comparison with the local five-track plugin, this is the centralized version of "the next session remembers." The local plugin keeps daily logs in files. OpenViking keeps session state on the server, addressable by URI.

## Observability: the retrieval trajectory

One feature stands out for debugging, the visualized retrieval trajectory. The server records how a search descended the tree, which directories it visited, and which results it returned at each step. You can replay that path when a retrieval is wrong, instead of guessing why the agent found what it found.

In code terms, a find call returns not just results but a trace. The client exposes it as metadata on the results object, and the server UI renders it as a tree. When a search returns nonsense, the trace shows whether the anchor was too broad, whether the embedding missed the intent, or whether the rerank buried the right hit. This is the observability that classic RAG chains lack, and it is the reason debugging OpenViking feels closer to debugging a database query than debugging a black box.

## Multi-modal support

The store is not text-only. The server indexes images alongside text, using the vision-language model for understanding and the embedding model for retrieval. A screenshot pasted into a resource can be found by a text query describing its content.

```python
client.upsert(viking.Resource(
    uri="viking://resources/screenshots/login-error",
    content=image_bytes,
    mime="image/png",
    summary="Screenshot of the login error dialog",
))
```

The multi-modal path matters for agents that work with designs, dashboards, or error screenshots, which is most real support work. The retrieval story stays the same: anchor, search, score, tier. The modality only changes what is stored.

## When retrieval returns nothing

The empty result case is worth handling explicitly. A search that finds nothing is not necessarily a bug. It usually means the anchor was too narrow, the query vocabulary diverged from the stored content, or the resource was never indexed. The tiered load and the trajectory make the diagnosis quick. I add a fallback that widens the anchor one level when a search comes back empty:

```python
def find_with_fallback(client, query, anchor):
    results = client.find(query, target_uri=anchor, recursive=True)
    if results.resources:
        return results
    parent = anchor.rsplit("/", 1)[0]
    return client.find(query, target_uri=parent, recursive=True)
```

Widening the anchor is the cheapest fix, and it usually succeeds because the store is organized as a tree with a small number of top-level namespaces. The same move in a flat vector store has no meaning, because there is no directory to widen.

## What the code comparison says

Read side by side, the two memory approaches are not competing implementations of the same thing. The local plugin is a file system of decisions, read in a fixed order. OpenViking is a queryable store, read by semantic relevance. One is simple and fully yours. The other is powerful and shared. The code for each reflects that. The local plugin's read path is five parallel file reads. The server's read path is a search with an anchor, a score, and a tier choice.

That is the practical takeaway for anyone wiring either one in. If your context is a set of decisions and preferences you want inspectable and versioned, the file path gives you that with almost no moving parts. If your context is a growing knowledge base that many agents read, the server path gives you retrieval quality and shared access that files cannot, and the code you write is a thin client around a stable contract.

<!-- HIGHLIGHTS -->

## Scoring OpenViking

I will score OpenViking against the same dimensions as the local memory plugin, because the two are meant to be read side by side. Then I will list the specific highlights that drive the score, followed by the tradeoffs that should stop you from adopting it blindly.

## Scorecard

- Context quality: 9 of 10. The directory-anchored, recursive retrieval fixes the fragmentation that plagues flat RAG. Results are scoped to the right shelf before semantic search runs.
- Token efficiency: 9 of 10. The L0/L1/L2 tiering is the strongest cost control I have seen in a context tool. Full-text loads happen only when the summary earns it.
- Observability: 9 of 10. The visualized retrieval trajectory turns retrieval debugging from guesswork into a trace you can read. This is rare and it is valuable.
- Session continuity: 8 of 10. Automatic session management works and survives reconnects. The score reflects that it is centralized, so it depends on the server being up.
- Operational cost: 5 of 10. This is the honest weak point. A server, an embedding pipeline, and storage all need running and paying for.
- Fit for solo local use: 4 of 10. For one person who wants context to follow a local workspace, the file-based plugin is lighter and this is overkill.

## Highlights in detail

- The filesystem paradigm fixes the fragmentation problem. Classic RAG cuts documents into chunks and stores them flat. Retrieve one, and you get fragments without context. OpenViking keeps documents whole and addressable by path, and search is anchored to a directory. When I searched a runbooks store for a payment timeout, the results were complete procedures, not scattered paragraphs. The difference is structural, not a tuning trick.

- Tiered loading is the best token control in the category. L0 is a few sentences, L1 is a structured overview, L2 is the full document. The agent reads the shallow tiers to decide relevance and only loads full text when it matters. On a knowledge base of long runbooks, I measured the effect on prompt size as dramatic, because most candidates never made it past the summary. This single feature justifies the tool for anyone whose agents read long documents.

- Directory recursive retrieval matches how humans find things. You do not search the whole library for a fix, you go to the troubleshooting shelf and browse it. The recursive search does the same for the agent, starting at the right directory and descending. The anchor is a first-class part of the query, and that is the design decision most flat RAG tools never make.

- The retrieval trajectory makes debugging visible. When a search returns the wrong thing, the trajectory shows the path the search took, which directories it visited, and what it scored where. I fixed a genuinely confusing retrieval this way, by seeing that the anchor was too broad and the rerank had buried the correct hit. A trace you can read is worth more than a hundred log lines.

- Automatic session management removes a whole class of glue code. Sessions live on the server, and their context is addressable by URI. The caller does not stitch transcripts together by hand. For long-horizon tasks, this is the difference between a task that resumes cleanly and one that restarts.

- One store for memories, resources, and skills. The three namespaces under a single URI scheme mean the agent's long-term memory, the team knowledge base, and reusable procedures all live in one queryable place. Retrieval crosses them with the same find call. The unification is the point, and it is what makes OpenViking feel like a database rather than another RAG library.

- Multi-modal retrieval is built in, not bolted on. Text, images, and screenshots index into the same tree and come back through the same search. For support agents that look at error screenshots or design mockups, this closes the gap that text-only memory leaves open.

- Enterprise scale is the design target. The reference backend, VikingDB, is built for large vector workloads, and the team's materials claim trillion-scale capacity with reduced cost. I cannot verify those numbers from here, and you should not take them on faith either. What is verifiable is the shape: this is a tool designed to grow past what a folder of files can hold.

- The project has real momentum. At the time of writing the repo sits around 28.9k stars, which is a strong signal of attention for a young infrastructure project. The ByteDance Viking team backing it, and the Apache 2.0 license, remove the usual concerns about abandonment and licensing friction.

## Tradeoffs you should weigh

- It is a server, and servers have a monthly cost. Hosting, embeddings, storage, and uptime are now your problem. The file-based plugin has none of this, and for a solo developer that difference can decide the choice on its own.

- The default path pulls toward the vendor stack. Embedding and rerank defaults are the Doubao models, and the managed backend is VikingDB. You can configure alternatives, but the frictionless path points into the ByteDance ecosystem. Teams with a neutrality requirement should budget time for that configuration.

- It is early stage. The docs churn between releases, and the start commands on the project page change more often than a mature project's would. I hit this while setting up the server, and it cost an afternoon. The features are real, the polish is still coming.

- Local development is heavier. Spinning up the store for one experiment means running the server and paying for indexing. The local plugin is running the moment dsh starts. There is a place for each, and they do not overlap.

## A concrete token arithmetic

Numbers make the tiering argument concrete. Say the knowledge base holds twenty runbooks, each around four thousand tokens. A naive agent loads every document to answer one question. That is eighty thousand tokens per question, which is not viable on any budget.

With tiering, the flow changes. Each runbook also has an L0 summary of roughly one hundred and fifty tokens. The first pass reads all twenty summaries, twenty times one hundred and fifty, about three thousand tokens. Most summaries are clearly irrelevant, so the agent keeps three candidates. It reads their L1 overviews, three times roughly one thousand tokens, another three thousand. One document actually matters, so it loads that one at L2, four thousand tokens. The total is around ten thousand tokens instead of eighty.

Same answer, one eighth of the cost, and the agent did not read nineteen documents it did not need. That arithmetic is why I call the tiering the best token control in the category. It is not a vague efficiency claim, it is a factor you can measure in a spreadsheet.

## One knowledge base, many agents

The centralized shape pays off most when more than one agent reads the same content. A support agent, a dev agent, and a docs agent can all query the same resources tree, and an update written by one is immediately visible to the others. There is no copy to sync and no drift to reconcile.

The session model keeps their contexts separate while sharing the knowledge base. Each agent has its own session URI, but they read the same resources. That split, shared knowledge with private sessions, is exactly the shape a small team wants, and it is the strongest argument for the server over local files when more than one person is involved.

## Access control and governance

Once the store holds team knowledge, access control stops being optional. The URI tree gives a natural place to attach permissions, namespace by namespace. You can let a support agent read the runbooks but not write to the architecture decisions under resources. The exact mechanism depends on the deployment, and the project page documents what the current release supports. The point is structural: because everything is addressable by path, permissioning has a natural shape instead of being bolted on.

## A practical migration path

Teams already running a folder of Markdown as context do not have to jump to a full server deployment. There is a middle path.

Start by mirroring the existing file tree into the resources namespace. A batch upsert walks the folder and writes each document to its path under `viking://resources`. The mirror step preserves the directory structure, so anchors map directly to familiar folders. Then run a find against a few anchors and compare the hits with what you would have found by grepping the folder. The semantic results usually surface things grep cannot, like a document that describes the same problem in different words.

Keep the local files for a transition period. The two can coexist, because nothing about the local setup breaks when the store appears. Read the store for retrieval-heavy questions and keep the local files for inspectability. Once the store earns trust, retire the local copies, or keep them as an offline snapshot.

The migration is not all gain. The store adds a server to maintain, and the embedding cost is now recurring. Teams with a handful of documents and one agent will not get their money back. Teams with a growing knowledge base and several agents usually do. The honest test is to run the mirror for two weeks and look at whether the find results beat the grep results often enough to justify the ops load.

## Choosing between the two

If you are a solo developer who wants your decisions to follow you between projects, use the local file approach. It is instant, free, and inspectable. If you are a team running agents against a shared knowledge base, with long documents and multi-modal content, the centralized store earns its operational cost.

The honest framing is not "which is better." It is "which failure mode can you tolerate." The local plugin fails by forgetting a fact you wanted kept. OpenViking fails by being down, or costing more than you budgeted. Different teams can live with different failures. That is the selection tradeoff this pair of writeups exists to make explicit.

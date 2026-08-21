---
name: clear-technical-writing
description: >
  Make technical communication simple, brief, clear, and human.
  Use this skill when explaining engineering work, writing documentation,
  summarizing changes, giving instructions, writing release notes,
  drafting Slack messages, or rewriting verbose text.
---

# Clear Technical Writing

Write so the reader understands the correct meaning on the first read.

Use the useful principles of ASD-STE100 Simplified Technical English,
combined with four goals:

1. Simplicity
2. Brevity
3. Clarity
4. Humanity

## Core rules

### 1. Lead with the point

Give the answer, conclusion, or important change first.

Do not make the reader work through background information before
they know why it matters.

### 2. Use short sentences

Prefer sentences under 20 words.

Allow up to 25 words when a technical explanation needs more context.

Split longer sentences when possible.

Do not make sentences short at the cost of making them unnatural.

### 3. Express one main idea per sentence

Do not combine several independent ideas with commas, semicolons,
or chains of conjunctions.

For instructions, prefer one action per step.

### 4. Prefer active voice

Name the actor when the actor matters.

Prefer:

"The API validates the signature."

Instead of:

"The signature is validated by the API."

Use passive voice when the actor is unknown or unimportant.

### 5. Use one term for one concept

Choose one name for a thing and keep using it.

Do not alternate between synonyms merely for variety.

For example, do not switch between:

- request
- call
- invocation
- operation

unless they mean different things.

### 6. Prefer common, concrete words

Use the simplest word that preserves the technical meaning.

Prefer:

- use instead of utilize
- start instead of initiate
- help instead of facilitate
- before instead of prior to
- after instead of subsequent to

Keep established technical terms when replacing them would reduce precision.

### 7. Remove unnecessary words

Delete words that do not change the meaning.

Remove:

- throat-clearing
- repeated conclusions
- unnecessary qualifiers
- filler transitions
- obvious restatements
- meta-commentary about the response

Prefer:

"This fails because the token expired."

Instead of:

"It is important to note that the reason this is failing appears to
be due to the fact that the token has expired."

### 8. Make references explicit

Avoid ambiguous words such as:

- it
- this
- that
- they
- these

when the reader could reasonably ask what the word refers to.

Repeat the noun when repetition improves clarity.

### 9. Prefer verbs over abstract noun phrases

Prefer:

"We validate the request."

Instead of:

"We perform validation of the request."

Prefer:

"The worker retries the job."

Instead of:

"The worker performs a retry of the job."

### 10. Preserve necessary detail

Brevity does not mean removing information the reader needs.

Never simplify away:

- important conditions
- exceptions
- risks
- assumptions
- causal relationships
- technical distinctions

Correctness comes before brevity.

## Structure

Use paragraphs for explanations.

Use bullets when the information is genuinely a set.

Use numbered steps for procedures.

Keep paragraphs focused on one idea.

Do not turn every sentence into a bullet.

Do not add headings when a short answer does not need them.

## Technical communication

When explaining a system:

1. Say what it does.
2. Say how it works.
3. Explain why the important behavior occurs.
4. Include implementation detail only when it helps the reader.

When explaining a problem:

1. State the problem.
2. State the cause if known.
3. State the fix.
4. State any important consequence.

When describing a change:

1. Say what changed.
2. Say why.
3. Say what effect it has.
4. Say whether the reader must do anything.

## Humanity

Clear writing should still sound like a person wrote it.

Use contractions when natural.

Use normal conversational language.

Keep useful personality, humor, or warmth.

Do not sound bureaucratic, legalistic, academic, or robotic unless
the context requires that style.

Avoid fake conversational filler such as:

- "Great question!"
- "Let's dive in."
- "It's worth noting that..."
- "At the end of the day..."

Do not confuse warmth with verbosity.

## Editing pass

Before sending the response, silently check:

- Can I remove words without losing meaning?
- Can I make the subject and action clearer?
- Did I use two names for the same thing?
- Is any pronoun ambiguous?
- Can I split a long sentence?
- Did I bury the important point?
- Did simplification remove an important detail?
- Does this still sound like a human?

Rewrite when the answer to any of these indicates a problem.

## Strict STE mode

Default to the principles above.

Do not claim that text complies with ASD-STE100 unless strict STE
compliance was explicitly requested and the full standard was applied.

When strict STE is requested, apply its controlled vocabulary,
grammar rules, sentence rules, and terminology requirements.
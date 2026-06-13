# Band Handoff Protocol Skill

## How agents hand off context in Band

Each agent follows this lifecycle for every message it receives:

1. `markProcessing(messageId)` — claim the message before doing any work
2. Do reasoning + tool calls, log progress via `postEvent(roomId, 'thought', {...})`
3. Post findings to the Band room via `sendMessage(roomId, content, [nextAgentId])`
4. `markProcessed(messageId)` on success, `markFailed(messageId, error)` on failure

## Handoff chain

```
Triage → @mentions Investigator
Investigator → @mentions Resolver
Resolver → @mentions human approver (GATE)
Notifier → no @mention needed (broadcasts)
```

## Crash recovery

If an agent crashes after `markProcessing` but before `markProcessed`,
restart the agent and re-drain the backlog with `drainBacklog(roomId)`.
Band will re-deliver unprocessed messages.

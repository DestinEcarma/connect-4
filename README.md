# Connect 4

Lightweight Connect-4 implementation in a monorepo. The project contains:

- `@connect-4/client` — React + Vite front-end (TypeScript, Tailwind).
- `@connect-4/server` — Node/Express + socket.io server that hosts matchmaking and game state.
- `@connect-4/shared` — shared TypeScript game logic (bitboard, rules, helpers).

> [!IMPORTANT]
>
> - Multiplayer online play using socket.io and a simple matchmaking queue.
> - Server-authoritative game state implemented in `@connect-4/shared` and the server `GameInstance`.
> - Minimal, component-driven UI in the client.

> [!NOTE]
>
> - Invites and local 1v1 are currently disabled
> - Matchmaking (online play) is the only feature available.

## Quick start

1. Install dependencies (root workspace):

```sh
npm install
```

2. Start the server (defaults to port 3000):

```sh
npm run dev:server
```

3. Start the client in a separate terminal:

```sh
npm run dev:client
```

4. To run both (concurrently) from the repo root:

```sh
npm run dev
```

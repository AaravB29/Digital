# CLAUDE.md
- Follow PLAN.md. Only build the phase I ask for, then stop and summarise what changed and how to test it.
- Money is integer cents everywhere. Never floats.
- Business logic goes in src/lib with Vitest tests; run `npm test` before saying a phase is done.
- Run `npm run build` at the end of every phase; fix all TypeScript errors.
- Don't add new dependencies without telling me why.
- Keep components small (< 150 lines); split if larger.
- Ask me before changing the data model in a way that would break existing saved data; if you must, write a Dexie version migration.

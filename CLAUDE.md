# CLAUDE.md - Guide for Agentic Coding Tools

## Build & Test Commands
- Build: `pnpm run build` (ESM+CJS)
- Test all: `pnpm test`
- Test UI: `pnpm test-ui`
- Test specific: `pnpm test parse.test.ts` or `pnpm test -t "parses a simple key-value"`
- Benchmark: `pnpm bench`
- TOML validation: `bash run-toml-test.bash`

## Code Style Guidelines
- TypeScript with strict typing and ES modules
- CamelCase for functions/variables, PascalCase for classes
- Explicit imports with `.js` extensions, use `type` keyword for type imports
- Modular design with separate files for different concerns
- Function-based approach with minimal class usage
- Custom error types with detailed error messages including line/column info
- Tests mirror source files with comprehensive coverage including edge cases
- Comments should explain "why" not "what"
- Performance is important - code should be concise and efficient

## Reference Documentation
- The complete TOML v1.0.0 specification is available locally in `toml-spec.md`
- Refer to this document when implementing any TOML parsing/serialization functionality
- Library aims for full compliance with this specification

This is a small, fast TOML parser/serializer library that aims for spec compliance with TOML v1.0.0.
.PHONY: run unit-test check

run:
	npm run dev

unit-test:
	npm run test:run

# Equivalent of `pre-commit run -a` — runs all checks against every file,
# not just staged ones. Bypasses lint-staged intentionally.
check:
	npx prettier --write .
	npx eslint --fix .
	npm run test:run

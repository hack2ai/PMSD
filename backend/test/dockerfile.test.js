const assert = require("assert");
const fs = require("fs");
const path = require("path");

const dockerfile = fs.readFileSync(path.join(__dirname, "..", "Dockerfile"), "utf8");
const dockerignore = fs.readFileSync(path.join(__dirname, "..", ".dockerignore"), "utf8");

assert.match(dockerfile, /^FROM node:22-bookworm-slim AS production/m);
assert.match(dockerfile, /npm ci --omit=dev/);
assert.match(dockerfile, /USER node/);
assert.match(dockerfile, /COPY src \.\/src/);
assert.match(dockerfile, /COPY database \.\/database/);
assert.match(dockerfile, /HEALTHCHECK/);
assert.match(dockerfile, /\/health\/live/);
assert.match(dockerfile, /CMD \["node", "src\/server\.js"\]/);

assert.match(dockerignore, /\.env/);
assert.match(dockerignore, /node_modules/);
assert.match(dockerignore, /\.git/);
assert.match(dockerignore, /logs?/);

console.log("dockerfile tests passed");

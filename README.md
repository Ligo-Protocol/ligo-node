## Setup

See `.env.example` for needed environment variables.

## Generate Seed

```
node scripts/generate-seed.js
```

Save this seed as `KEY_SEED`. This is the seed of the key pair used by the service.

## Generate DID Document

This command will generate the DID document to be published.

```
node scripts/generate-did-document.mjs > ./public/.well-known/did.json
```

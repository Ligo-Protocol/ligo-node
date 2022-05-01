// Test the reading of a published DID document
import "dotenv/config";
import { Resolver } from "did-resolver";
import { getResolver } from "web-did-resolver";

const webResolver = getResolver();

const didResolver = new Resolver({
  ...webResolver,
});

console.log(await didResolver.resolve(`did:web:${process.env.SERVER_HOST}`));

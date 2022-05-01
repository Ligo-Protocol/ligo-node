// Test the encryption to a did:web
import "dotenv/config";
import { Resolver } from "did-resolver";
import WebResolver from "web-did-resolver";
import KeyResolver from "key-did-resolver";
import { DID } from "dids";

const webResolver = WebResolver.getResolver();
const keyResolver = KeyResolver.getResolver();

const did = new DID({
  resolver: new Resolver({
    ...webResolver,
    ...keyResolver,
  }),
});

const jwe = await did.createDagJWE("secret message", [
  `did:web:${process.env.SERVER_HOST}`,
]);
console.log(JSON.stringify(jwe, null, 2));

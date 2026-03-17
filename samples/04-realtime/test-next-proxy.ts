import next from "next";
import { createServer } from "http";

const app = next({ dev: true, dir: "." });
await app.prepare();
const handle = app.getRequestHandler();

createServer((req, res) => handle(req, res)).listen(0, "127.0.0.1", function(this: any) {
  const port = this.address().port;
  console.log("Listen on", port);
  fetch(`http://127.0.0.1:${port}/`).then(async r => {
    console.log("STATUS", r.status);
    console.log("TEXT START", (await r.text()).substring(0, 30));
    process.exit();
  }).catch(e => {
    console.error("FAIL", e);
    process.exit(1);
  });
});

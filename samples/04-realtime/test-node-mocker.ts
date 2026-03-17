import next from "next";
import { createServer } from "http";

const app = next({ dev: true, dir: "." });
app.prepare().then(() => {
  const handle = app.getRequestHandler();

  const server = createServer((req, res) => {
    console.log("Req URL:", req.url);
    handle(req, res);
  });
  
  server.listen(3006, "127.0.0.1", () => {
    console.log("Next is ready on 3006");
  });

  setTimeout(async () => {
    const res = await fetch("http://127.0.0.1:3006/");
    console.log(res.status, await res.text());
    process.exit();
  }, 500);
});

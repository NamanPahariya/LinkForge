import { app } from "./server.js";

const port = Number.parseInt(process.env.PORT || "3000", 10);

app.listen(port, () => {
  console.log(`LinkForge API listening on port ${port}`);
});

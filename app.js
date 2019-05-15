const Koa = require("koa");
const logger = require("koa-logger");
const Router = require("koa-router");
const static = require("koa-static");
const cors = require("@koa/cors");
const sqlite = require("sqlite");
const qs = require("./data");

const DB_LOC = "./data/data.sqlite";

const port = process.env.port || 3000;

const app = new Koa();
const router = new Router();

app.use(cors());
app.use(logger());
app.use(static("public/"));
app.use(
  (() => {
    let db;
    return async (ctx, next) => {
      if (!db) {
        try {
          db = await sqlite.open(DB_LOC);
        } catch (err) {
          db = null;
          ctx.throw(500, "Unable to open SQLite db.");
          return;
        }
      }
      ctx.db = db;
      return next();
    };
  })()
);

router.get("/query", async ctx => {
  let { tbl, day } = ctx.query;
  day = parseInt(day);
  if (!tbl || !["taxi", "uber"].includes(tbl))
    ctx.throw(400, "Table is required in query and it must be taxi or uber");
  if (!day || !(day >= 1 && day <= 30))
    ctx.throw(400, "Day is required in query and it must be between 1 and 30");
  ctx.body = await ctx.db.all(
    tbl === "taxi" ? qs.findTaxiDate(day) : qs.findUberDate(day)
  );
});

router.all("*", async ctx => {
  ctx.body = { routes: router.stack.map(e => e.path) };
});

app.use(router.routes());

app.listen(port, () => {
  console.log(`App is running in ${port}`);
});

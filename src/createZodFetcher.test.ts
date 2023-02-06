import { afterAll, afterEach, beforeAll, expect, it } from "vitest";
import { rest } from "msw";
import { setupServer } from "msw/node";
import "isomorphic-fetch";
import { createZodFetcher } from ".";
import { z, ZodError } from "zod";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("Should create a default fetcher", async () => {
  server.use(
    rest.get("https://example.com", (req, res, ctx) => {
      return res(ctx.json({ hello: "world" }), ctx.status(200));
    }),
  );

  const fetchWithZod = createZodFetcher();

  const response = await fetchWithZod(
    z.object({
      hello: z.string(),
    }),
    "https://example.com",
  );

  expect(response).toEqual({
    hello: "world",
  });
});

it("Should throw an error with mis-matched schemas with a default fetcher", async () => {
  server.use(
    rest.get("https://example.com", (req, res, ctx) => {
      return res(ctx.json({ hello: "world" }), ctx.status(200));
    }),
  );

  const fetchWithZod = createZodFetcher();

  await expect(
    fetchWithZod(
      z.object({
        hello: z.number(),
      }),
      "https://example.com",
    ),
  ).rejects.toMatchObject(
    ZodError.create([
      {
        code: "invalid_type",
        expected: "number",
        received: "string",
        path: ["hello"],
        message: "Expected number, received string",
      },
    ]),
  );
});

it("Should throw an error if response is not ok with the default fetcher", async () => {
  server.use(
    rest.get("https://example.com", (req, res, ctx) => {
      return res(
        ctx.json({
          error: "Invalid permissions",
        }),
        ctx.status(403),
      );
    }),
  );

  const fetchWithZod = createZodFetcher();

  await expect(
    fetchWithZod(
      z.object({
        hello: z.number(),
      }),
      "https://example.com",
    ),
  ).rejects.toMatchInlineSnapshot("[Error: Request failed with status 403]");
});

it("Should handle successes with custom fetchers", async () => {
  const fetcher = createZodFetcher(async () => {
    return fetch("https://example.com").then((res) => res.json());
  });

  server.use(
    rest.get("https://example.com", (req, res, ctx) => {
      return res(ctx.json({ hello: "world" }), ctx.status(200));
    }),
  );

  const response = await fetcher(
    z.object({
      hello: z.string(),
    }),
  );

  expect(response).toEqual({
    hello: "world",
  });
});

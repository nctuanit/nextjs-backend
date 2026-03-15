import introRaw from "./src/content/intro.mdx" with { type: "text" };
console.log((introRaw as unknown as string).substring(0, 20));

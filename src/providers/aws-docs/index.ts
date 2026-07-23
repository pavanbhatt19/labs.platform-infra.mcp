import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AwsDocsConfig } from "../../config.js";
import { AwsDocsClient } from "./client.js";

export function registerAwsDocsTools(server: McpServer, _config: AwsDocsConfig) {
  const client = new AwsDocsClient();

  server.tool("aws_docs_search", "Search AWS documentation", {
    search_phrase: z.string().describe("Search phrase"),
    limit: z.number().optional().describe("Max results (default 10)"),
  }, async (params) => {
    return client.searchDocumentation(params.search_phrase, params.limit);
  });

  server.tool("aws_docs_read", "Read an AWS documentation page", {
    url: z.string().describe("URL of the AWS documentation page (.html)"),
    max_length: z.number().optional().describe("Max characters to return (default 5000)"),
    start_index: z.number().optional().describe("Start at this character index"),
  }, async (params) => {
    return client.readDocumentation(params.url, params.max_length, params.start_index);
  });

  server.tool("aws_docs_read_sections", "Extract specific sections from an AWS doc page", {
    url: z.string().describe("URL of the AWS documentation page"),
    section_titles: z.array(z.string()).describe("Section titles to extract"),
  }, async (params) => {
    return client.readSections(params.url, params.section_titles);
  });
}

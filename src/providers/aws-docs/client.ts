import axios from "axios";
import { toolResult, toolError } from "../../utils/http.js";

export class AwsDocsClient {
  private searchUrl = "https://docs.aws.amazon.com/search/doc-search.html";

  async searchDocumentation(searchPhrase: string, limit?: number) {
    try {
      const response = await axios.get(this.searchUrl, {
        params: {
          searchQuery: searchPhrase,
          is498: "true",
          limit: limit || 10,
        },
        timeout: 15000,
      });
      return toolResult(response.data);
    } catch (error: any) {
      return toolError(`AWS docs search failed: ${error.message}`);
    }
  }

  async readDocumentation(url: string, maxLength?: number, startIndex?: number) {
    try {
      if (!url.includes("docs.aws.amazon.com") || !url.endsWith(".html")) {
        return toolError("URL must be from docs.aws.amazon.com and end with .html");
      }
      const response = await axios.get(url, { timeout: 15000 });
      let content = this.htmlToMarkdown(response.data);
      const start = startIndex || 0;
      const max = maxLength || 5000;
      content = content.substring(start, start + max);
      return toolResult({ url, content, length: content.length, truncated: content.length >= max });
    } catch (error: any) {
      return toolError(`Failed to read documentation: ${error.message}`);
    }
  }

  async readSections(url: string, sectionTitles: string[]) {
    try {
      if (!url.includes("docs.aws.amazon.com") || !url.endsWith(".html")) {
        return toolError("URL must be from docs.aws.amazon.com and end with .html");
      }
      const response = await axios.get(url, { timeout: 15000 });
      const content = this.htmlToMarkdown(response.data);
      const sections: Record<string, string> = {};
      for (const title of sectionTitles) {
        const regex = new RegExp(`## ${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
        const match = content.match(regex);
        sections[title] = match ? match[1].trim() : "Section not found";
      }
      return toolResult({ url, sections });
    } catch (error: any) {
      return toolError(`Failed to read sections: ${error.message}`);
    }
  }

  private htmlToMarkdown(html: string): string {
    // Simple HTML to text conversion - strips tags, preserves headings and content
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
      .replace(/<pre[^>]*>(.*?)<\/pre>/gis, "```\n$1\n```\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}

export function toolResult(content: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof content === "string" ? content : JSON.stringify(content, null, 2),
      },
    ],
  };
}

export function toolError(message: string): { content: Array<{ type: "text"; text: string }>; isError: true } {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

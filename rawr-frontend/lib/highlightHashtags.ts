export function highlightHashtags(html: string): string {
  return html.replace(
    /#[\p{L}\p{N}_]+/gu,
    (match) => `<span class="text-accent">${match}</span>`,
  )
}

export function linkifyMentions(html: string): string {
  return html.replace(
    /@[\p{L}\p{N}_]+(?:\.[\p{L}\p{N}_]+)*/gu,
    (match) => {
      const username = match.slice(1)
      return `<a href="https://www.instagram.com/${username}/" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">${match}</a>`
    },
  )
}

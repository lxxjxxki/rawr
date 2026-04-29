export function highlightHashtags(html: string): string {
  return html.replace(
    /#[\p{L}\p{N}_]+/gu,
    (match) => {
      const url = `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(match)}`
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">${match}</a>`
    },
  )
}

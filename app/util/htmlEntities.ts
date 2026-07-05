import he from 'he'

export function decodeHtmlEntities(str: string): string {
  return he.decode(str)
}

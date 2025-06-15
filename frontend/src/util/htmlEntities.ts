import he from 'he'

//https://stackoverflow.com/a/7394787
export function decodeHtmlEntities(str: string): string {
  return he.decode(str)
}

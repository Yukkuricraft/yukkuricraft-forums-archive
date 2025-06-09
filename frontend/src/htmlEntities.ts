//https://stackoverflow.com/a/7394787
export function decodeHtmlEntities(str: string): string {
  const txt = document.createElement('textarea')
  txt.innerHTML = str
  return txt.value
}
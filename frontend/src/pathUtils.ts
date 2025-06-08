export function pageFromPath(pageStr: string | undefined) {
  if (pageStr !== undefined && isPagePart(pageStr)) {
    return parseInt(pageStr.substring(4))
  } else {
    return 1
  }
}

export function isPagePart(part: string) {
  return /page\d+/gm.test(part)
}


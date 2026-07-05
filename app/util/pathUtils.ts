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

export function pageCount(entries: number, pageSize: number) {
  const extra = entries % pageSize === 0 ? 0 : 1
  const res = Math.floor(entries / pageSize) + extra
  if (isNaN(res)) {
    console.warn('Got NaN in page calc: ', entries, pageSize)
    return 1
  }
  return res
}

export function pageCount(entries: number, pageSize: number) {
  const extra = entries % pageSize === 0 ? 0 : 1
  const res = Math.floor(entries / pageSize) + extra
  if (isNaN(res)) {
    console.warn('Got NaN in page calc: ', entries, pageSize)
    return 1
  }
  return res
}
export function normalizeCompanyId(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-ぁ-んァ-ヶ一-龠ー]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const copyToClipboard = async (text: string | undefined): Promise<void> => {
  if (!text) return
  if (navigator.clipboard) {
    return await navigator.clipboard.writeText(text)
  }
}

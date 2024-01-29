export const formatInvoice = (invoice: string, showChars = 14): string => {
  return `${invoice.substring(0, showChars)}...${invoice.substring(
    invoice.length - showChars,
    invoice.length
  )}`
}

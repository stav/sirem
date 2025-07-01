export function formatLocalDate(dateString: string) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('T')[0].split('-')
  return `${month}/${day}/${year}`
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export function getStatusBadge(status: string | null) {
  if (!status) return null;
  
  switch (status) {
    case 'Client':
      return {
        className: "px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200",
        text: status
      };
    case 'New':
      return {
        className: "px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800 border border-gray-300",
        text: status
      };
    case 'Contacted':
      return {
        className: "px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800 border border-yellow-400",
        text: status
      };
    case 'Engaged':
      return {
        className: "px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-400",
        text: status
      };
    default:
      return {
        className: "text-xs",
        text: status,
        variant: "outline" as const
      };
  }
} 

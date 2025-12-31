import { useEffect } from 'react'

/**
 * Custom hook to set the document title for dynamic titles that depend on client state.
 * For static titles, use Next.js metadata API in layout.tsx files instead.
 *
 * This is used for the manage page where the title includes the selected contact's name.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title
  }, [title])
}

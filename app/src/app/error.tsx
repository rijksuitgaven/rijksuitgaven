'use client'

import { ErrorReport } from '@/components/error-boundary'

export default function Error() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <ErrorReport message="Er is een fout opgetreden" />
    </div>
  )
}

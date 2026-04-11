'use client'

import { useRef, useState } from 'react'
import { parseFlexXml } from '@/lib/ibkr/parser-xml'
import { parseCsv } from '@/lib/ibkr/parser-csv'
import type { IBKRData } from '@/lib/ibkr/types'

interface Props {
  onData: (data: IBKRData) => void
  onError: (msg: string) => void
}

export function FileUploadCard({ onData, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xml', 'csv'].includes(ext ?? '')) {
      onError('Unsupported file type. Please upload an XML (Flex Query) or CSV (Activity Statement) file.')
      return
    }
    try {
      const text = await file.text()
      const data = ext === 'xml' ? parseFlexXml(text) : parseCsv(text)
      onData(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error parsing file.'
      onError(`Could not parse file: ${message}`)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-white dark:bg-slate-900">
      <div className="text-3xl mb-3">📁</div>
      <h3 className="font-bold text-slate-900 dark:text-white mb-1">Upload Files</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Upload your Flex Query XML or Activity Statement CSV file.
      </p>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
            : 'border-slate-300 dark:border-slate-600 hover:border-blue-300'
        }`}
      >
        <p className="text-slate-400 text-sm">Drop XML or CSV here</p>
        <p className="text-slate-300 text-xs mt-1">or click to browse</p>
      </div>
      <input ref={inputRef} type="file" accept=".xml,.csv" onChange={onChange} className="hidden" />

      <p className="mt-3 text-xs text-slate-400">Accepted: Flex Query XML · Activity Statement CSV</p>
    </div>
  )
}

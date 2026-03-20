import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  value: string
  onSearch: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export function SearchInput({
  value,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)

  // Sync from external (URL) changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounce local changes to onSearch
  useEffect(() => {
    if (localValue === value) return

    const timer = setTimeout(() => {
      onSearch(localValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, debounceMs, onSearch, value])

  return (
    <Input
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      className="max-w-sm"
    />
  )
}

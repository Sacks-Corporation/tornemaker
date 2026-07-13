import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import Spinner from '../Spinner'
import type { SelectOption } from '../../../types/common.types'

export interface SelectProps<T extends string = string> {
  label: string
  options: SelectOption<T>[]
  value: T | null
  onChange: (value: T) => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  loadingLabel?: string
  name?: string
}

function Select<T extends string = string>({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  isLoading = false,
  loadingLabel,
  name,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()
  const isDisabled = disabled || isLoading

  const selectedOption = options.find((option) => option.value === value) ?? null
  const hasValue = selectedOption !== null

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (open) {
      const selectedIndex = options.findIndex((option) => option.value === value)
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
      listRef.current?.focus()
    }
  }, [open, options, value])

  const selectOptionAt = (index: number) => {
    const option = options[index]
    if (!option || option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (isDisabled) return

    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
    }
  }

  const handleListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        event.preventDefault()
        selectOptionAt(highlightedIndex)
        break
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        break
      default:
        break
    }
  }

  return (
    <div className="flex w-full flex-col gap-1" ref={containerRef}>
      <span className="text-sm font-medium text-text-muted">{label}</span>

      <div className="relative">
        <button
          type="button"
          name={name}
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-busy={isLoading || undefined}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={handleTriggerKeyDown}
          className={[
            'flex w-full items-center justify-between rounded-lg border bg-surface px-3 py-2.5 text-left text-sm transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            open ? 'border-primary ring-2 ring-primary/30' : 'border-border',
            isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary',
            hasValue ? 'text-text' : 'text-text-muted',
          ].join(' ')}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          {isLoading ? (
            <Spinner size="sm" label={loadingLabel} className="ml-2 text-primary" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`ml-2 h-4 w-4 shrink-0 text-primary transition-transform duration-150 ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleListKeyDown}
            ref={listRef}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg focus:outline-none"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isHighlighted = index === highlightedIndex

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOptionAt(index)}
                  className={[
                    'flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors duration-100',
                    option.disabled ? 'cursor-not-allowed opacity-50' : '',
                    isHighlighted ? 'bg-primary/15' : '',
                    isSelected ? 'font-semibold text-primary' : 'text-text',
                  ].join(' ')}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.006l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.796 2.796 6.79-6.882a1 1 0 0 1 1.414-.02Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Select

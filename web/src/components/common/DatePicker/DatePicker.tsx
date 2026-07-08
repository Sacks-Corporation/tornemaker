import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { addMonths, getCalendarDays, isSameDay } from '../../../utils/date.utils'

export interface DatePickerProps {
  label: string
  value: Date | null
  onChange: (date: Date) => void
  placeholder: string
  previousMonthLabel: string
  nextMonthLabel: string
  monthNames: readonly string[]
  weekdayNames: readonly string[]
  formatValue: (date: Date) => string
  disabled?: boolean
  name?: string
}

function DatePicker({
  label,
  value,
  onChange,
  placeholder,
  previousMonthLabel,
  nextMonthLabel,
  monthNames,
  weekdayNames,
  formatValue,
  disabled,
  name,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState<Date>(value ?? new Date())
  const containerRef = useRef<HTMLDivElement>(null)
  const today = new Date()

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
    if (open) setVisibleMonth(value ?? new Date())
  }, [open, value])

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
    }
    if (event.key === 'Escape') setOpen(false)
  }

  const selectDay = (date: Date) => {
    onChange(date)
    setOpen(false)
  }

  const days = getCalendarDays(visibleMonth)

  return (
    <div className="flex w-full flex-col gap-1" ref={containerRef}>
      <span className="text-sm font-medium text-text-muted">{label}</span>

      <div className="relative">
        <button
          type="button"
          name={name}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          className={[
            'flex w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 py-2.5 text-left text-sm transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background',
            open ? 'border-primary ring-2 ring-primary/30' : 'border-border',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary',
            value ? 'text-text' : 'text-text-muted',
          ].join(' ')}
        >
          <span className="truncate">{value ? formatValue(value) : placeholder}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4 shrink-0 text-primary"
            aria-hidden="true"
          >
            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm13 8H4v10h16V10Z" />
          </svg>
        </button>

        {open && (
          <div
            role="dialog"
            aria-label={label}
            className="absolute z-50 mt-1 w-72 rounded-lg border border-border bg-surface p-3 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label={previousMonthLabel}
                onClick={() => setVisibleMonth((prev) => addMonths(prev, -1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors duration-100 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 0 1 .02 1.06L8.832 10l3.978 3.71a.75.75 0 1 1-1.02 1.1l-4.5-4.2a.75.75 0 0 1 0-1.1l4.5-4.2a.75.75 0 0 1 1.06.02Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <span className="text-sm font-semibold text-text">
                {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </span>

              <button
                type="button"
                aria-label={nextMonthLabel}
                onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors duration-100 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 0 1-.02-1.06L11.168 10 7.19 6.29a.75.75 0 1 1 1.02-1.1l4.5 4.2a.75.75 0 0 1 0 1.1l-4.5 4.2a.75.75 0 0 1-1.06-.02Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {weekdayNames.map((weekday) => (
                <span key={weekday} className="text-xs font-medium text-text-muted">
                  {weekday}
                </span>
              ))}

              {days.map(({ date, isCurrentMonth }) => {
                const isSelected = value !== null && isSameDay(date, value)
                const isToday = isSameDay(date, today)

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => selectDay(date)}
                    className={[
                      'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors duration-100',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      isSelected
                        ? 'bg-primary font-semibold text-on-primary'
                        : 'hover:bg-primary/10',
                      !isSelected && isToday ? 'border border-primary text-primary' : '',
                      !isCurrentMonth && !isSelected ? 'text-text-muted/50' : '',
                      isCurrentMonth && !isSelected && !isToday ? 'text-text' : '',
                    ].join(' ')}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DatePicker

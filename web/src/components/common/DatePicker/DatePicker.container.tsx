import { useTranslation } from 'react-i18next'
import DatePicker from './DatePicker'
import { formatDate } from '../../../utils/date.utils'

export interface DatePickerContainerProps {
  label: string
  value: Date | null
  onChange: (date: Date) => void
  disabled?: boolean
  name?: string
}

function DatePickerContainer({ label, value, onChange, disabled, name }: DatePickerContainerProps) {
  const { t } = useTranslation()

  const monthNames = t('common.datePicker.months', { returnObjects: true }) as string[]
  const weekdayNames = t('common.datePicker.weekdaysShort', { returnObjects: true }) as string[]

  return (
    <DatePicker
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      name={name}
      placeholder={t('common.datePicker.placeholder')}
      previousMonthLabel={t('common.datePicker.previousMonth')}
      nextMonthLabel={t('common.datePicker.nextMonth')}
      monthNames={monthNames}
      weekdayNames={weekdayNames}
      formatValue={formatDate}
    />
  )
}

export default DatePickerContainer

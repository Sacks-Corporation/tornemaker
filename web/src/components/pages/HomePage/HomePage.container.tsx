import { useState } from 'react'
import HomePage from './HomePage'
import type { SelectOption, RadioOption } from '../../../types/common.types'

const FORMAT_OPTIONS: SelectOption[] = [
  { value: 'single-elimination', label: 'Eliminación simple' },
  { value: 'double-elimination', label: 'Eliminación doble' },
  { value: 'round-robin', label: 'Todos contra todos' },
  { value: 'swiss', label: 'Sistema suizo' },
]

const VISIBILITY_OPTIONS: RadioOption[] = [
  { value: 'public', label: 'Público' },
  { value: 'private', label: 'Privado' },
]

function HomePageContainer() {
  const title = 'home.title'
  const subtitle = 'home.subtitle'

  const [format, setFormat] = useState<string | null>(null)
  const [date, setDate] = useState<Date | null>(null)
  const [visibility, setVisibility] = useState<string | null>('public')

  return (
    <HomePage
      title={title}
      subtitle={subtitle}
      formatOptions={FORMAT_OPTIONS}
      formatValue={format}
      onFormatChange={setFormat}
      date={date}
      onDateChange={setDate}
      visibilityOptions={VISIBILITY_OPTIONS}
      visibilityValue={visibility}
      onVisibilityChange={setVisibility}
    />
  )
}

export default HomePageContainer

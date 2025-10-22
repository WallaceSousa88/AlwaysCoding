import { useFormContext } from 'react-hook-form'

interface Props {
  name: string
  label: string
  placeholder?: string
}

export function LabeledInput({ name, label, placeholder }: Props) {
  const { register } = useFormContext()

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.25rem' }}>{label}</label>
      <input
        {...register(name)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
    </div>
  )
}
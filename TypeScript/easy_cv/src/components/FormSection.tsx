import { ReactNode, useState } from 'react'

interface Props {
  title: string
  children: ReactNode
}

export function FormSection({ title, children }: Props) {
  const [aberto, setAberto] = useState(true)

  return (
    <section style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '0.5rem',
          fontWeight: 'bold',
          background: '#f0f0f0',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {title} {aberto ? '▲' : '▼'}
      </button>
      {aberto && <div style={{ padding: '0.5rem 0' }}>{children}</div>}
    </section>
  )
}
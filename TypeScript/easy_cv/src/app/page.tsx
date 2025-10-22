'use client'

import { useForm, FormProvider, useWatch } from 'react-hook-form'
import { Experiencia } from '@/components/Experiencia'
import { Educacao } from '@/components/Educacao'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function Page() {
  const methods = useForm()
  const { handleSubmit, control } = methods
  const dados = useWatch({ control })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />

      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Formulário */}
        <div
          style={{
            width: '33%',
            padding: '1rem',
            overflowY: 'auto',
            borderRight: '1px solid #ddd',
            boxSizing: 'border-box'
          }}
        >
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit((data) => console.log(data))}>
              <Experiencia />
              <Educacao />
              <button type="submit" style={{ marginTop: '1rem' }}>
                Gerar Currículo
              </button>
            </form>
          </FormProvider>
        </div>

        {/* Visualização */}
        <div style={{ width: '67%', padding: '2rem', overflowY: 'auto' }}>
          <h2>Pré-visualização</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(dados, null, 2)}</pre>
        </div>
      </main>

      <Footer />
    </div>
  )
}
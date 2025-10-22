import { Fragment } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FormSection } from '@/components/FormSection'
import { LabeledInput } from '@/components/LabeledInput'

export function Experiencia() {
  const { control, register } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experiencias'
  })

  const adicionarExperiencia = () => {
    append({
      cargo: '',
      empresa: '',
      periodo: '',
      descricao: ''
    })
  }

  return (
    <FormSection title="Experiência Profissional">
      <LabeledInput
        name="titulos.experiencia"
        label="Título da Seção"
        placeholder="Experiência Profissional"
      />

      {fields.map((field, index) => (
        <Fragment key={field.id}>
          <LabeledInput
            name={`experiencias.${index}.cargo`}
            label="Cargo"
            placeholder="Ex: Gerente de Vendas"
          />
          <LabeledInput
            name={`experiencias.${index}.empresa`}
            label="Empresa"
            placeholder="Ex: Supermercado Central"
          />
          <LabeledInput
            name={`experiencias.${index}.periodo`}
            label="Período"
            placeholder="Ex: Mar 2020 - Ago 2023"
          />
          <LabeledInput
            name={`experiencias.${index}.descricao`}
            label="Descrição"
            placeholder="Ex: Responsável pela equipe de atendimento e metas de vendas."
          />
          <button
            type="button"
            onClick={() => remove(index)}
            style={{ marginBottom: '1rem', color: 'red' }}
          >
            Remover Experiência
          </button>
          <hr />
        </Fragment>
      ))}

      <button type="button" onClick={adicionarExperiencia}>
        + Adicionar Experiência
      </button>
    </FormSection>
  )
}
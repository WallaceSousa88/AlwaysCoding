import { Fragment } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FormSection } from '@/components/FormSection'
import { LabeledInput } from '@/components/LabeledInput'

export function Educacao() {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'educacao'
  })

  const adicionarEducacao = () => {
    append({
      instituicao: '',
      curso: '',
      nivel: '',
      inicio: '',
      fim: ''
    })
  }

  return (
    <FormSection title="Formação Acadêmica">
      <LabeledInput
        name="titulos.educacao"
        label="Título da Seção"
        placeholder="Formação Acadêmica"
      />

      {fields.map((field, index) => (
        <Fragment key={field.id}>
          <LabeledInput
            name={`educacao.${index}.instituicao`}
            label="Instituição"
            placeholder="Ex: Universidade Federal de Minas Gerais"
          />
          <LabeledInput
            name={`educacao.${index}.curso`}
            label="Curso"
            placeholder="Ex: Administração"
          />
          <LabeledInput
            name={`educacao.${index}.nivel`}
            label="Nível"
            placeholder="Ex: Bacharelado"
          />
          <LabeledInput
            name={`educacao.${index}.inicio`}
            label="Início"
            placeholder="Ex: Mar 2018"
          />
          <LabeledInput
            name={`educacao.${index}.fim`}
            label="Conclusão"
            placeholder="Ex: Dez 2022"
          />
          <button
            type="button"
            onClick={() => remove(index)}
            style={{ marginBottom: '1rem', color: 'red' }}
          >
            Remover Formação
          </button>
          <hr />
        </Fragment>
      ))}

      <button type="button" onClick={adicionarEducacao}>
        + Adicionar Formação
      </button>
    </FormSection>
  )
}
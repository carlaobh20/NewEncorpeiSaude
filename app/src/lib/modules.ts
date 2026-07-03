export type Slug = 'peso' | 'agua' | 'treino' | 'sono' | 'alimentacao' | 'calorias' | 'proteina'

export type ModuleConfig = {
  slug: Slug
  title: string
  icon: string
  tone: string
  unit: string
  hero: string
  heroSub: string
  goalLabel: string
  quickAdd: { label: string; value: string }[]
  history: { label: string; value: string; sub?: string }[]
  insight: string
}

export const modules: Record<Slug, ModuleConfig> = {
  peso: {
    slug: 'peso', title: 'Peso', icon: 'scale', tone: 'emerald', unit: 'kg',
    hero: '123.4', heroSub: 'kg · hoje 07:05', goalLabel: 'Meta 118 kg · faltam 5.4 kg',
    quickAdd: [{ label: 'Registrar peso', value: 'input' }],
    history: [
      { label: 'Hoje', value: '123.4 kg', sub: '▼ 0.6' },
      { label: 'Ontem', value: '124.0 kg', sub: '▼ 0.3' },
      { label: '01/07', value: '124.3 kg', sub: '▼ 0.5' },
      { label: '29/06', value: '124.8 kg', sub: '▲ 0.1' },
    ],
    insight: 'Queda consistente de ~0.5 kg/semana. No ritmo certo pra bater a meta em ~10 semanas.',
  },
  agua: {
    slug: 'agua', title: 'Água', icon: 'water', tone: 'sky', unit: 'ml',
    hero: '2.1', heroSub: 'L de 3 L · 70%', goalLabel: 'Faltam 900 ml pra meta de hoje',
    quickAdd: [{ label: '+250 ml', value: '250' }, { label: '+500 ml', value: '500' }, { label: '+750 ml', value: '750' }],
    history: [
      { label: '16:00', value: '600 ml' }, { label: '13:10', value: '500 ml' },
      { label: '10:30', value: '500 ml' }, { label: '07:40', value: '500 ml' },
    ],
    insight: 'Você bate a meta em 4 de 7 dias. Beber 500 ml ao acordar fecharia a lacuna.',
  },
  treino: {
    slug: 'treino', title: 'Treino', icon: 'dumbbell', tone: 'emerald', unit: '',
    hero: '4', heroSub: 'treinos esta semana', goalLabel: 'Meta 4/semana · concluída ✓',
    quickAdd: [{ label: 'Iniciar treino', value: 'start' }, { label: 'Registrar concluído', value: 'log' }],
    history: [
      { label: 'Hoje', value: 'Peito & Tríceps', sub: '52 min' },
      { label: 'Ontem', value: 'Pernas', sub: '61 min' },
      { label: '01/07', value: 'Costas & Bíceps', sub: '48 min' },
    ],
    insight: 'Volume de treino subiu 18% no mês. Recuperação é o gargalo — priorize sono.',
  },
  sono: {
    slug: 'sono', title: 'Sono', icon: 'moon', tone: 'violet', unit: 'h',
    hero: '6h45', heroSub: 'noite passada', goalLabel: 'Meta 8h · déficit de 1h15',
    quickAdd: [{ label: 'Registrar sono', value: 'input' }],
    history: [
      { label: 'Hoje', value: '6h45', sub: '71% qualidade' },
      { label: 'Ontem', value: '7h20', sub: '80%' },
      { label: '01/07', value: '6h10', sub: '64%' },
    ],
    insight: 'Média de 6h50 na semana. Abaixo do ideal — impacta direto seu Health Score.',
  },
  alimentacao: {
    slug: 'alimentacao', title: 'Alimentação', icon: 'fork', tone: 'orange', unit: 'kcal',
    hero: '1.842', heroSub: 'kcal de 2.200', goalLabel: 'Restam 358 kcal · Proteína 128/150g',
    quickAdd: [{ label: 'Café', value: 'cafe' }, { label: 'Almoço', value: 'almoco' }, { label: 'Jantar', value: 'jantar' }, { label: 'Lanche', value: 'lanche' }],
    history: [
      { label: 'Almoço · 12:30', value: '640 kcal', sub: '48g proteína' },
      { label: 'Lanche · 10:00', value: '210 kcal', sub: '12g' },
      { label: 'Café · 07:30', value: '420 kcal', sub: '28g' },
    ],
    insight: 'Proteína ficou 22g abaixo da meta ontem. Um shake fecharia a conta.',
  },
  calorias: {
    slug: 'calorias', title: 'Calorias', icon: 'flame', tone: 'orange', unit: 'kcal',
    hero: '1.842', heroSub: 'de 2.200 kcal', goalLabel: 'Saldo do dia: -358 kcal (déficit)',
    quickAdd: [{ label: 'Registrar refeição', value: 'refeicao' }],
    history: [
      { label: 'Ingerido', value: '1.842 kcal' }, { label: 'Gasto (treino)', value: '520 kcal' },
      { label: 'Basal', value: '1.780 kcal' },
    ],
    insight: 'Déficit médio de 400 kcal/dia — coerente com a perda de peso observada.',
  },
  proteina: {
    slug: 'proteina', title: 'Proteína', icon: 'protein', tone: 'rose', unit: 'g',
    hero: '128', heroSub: 'g de 150 g', goalLabel: 'Faltam 22 g pra meta de hoje',
    quickAdd: [{ label: '+30g (shake)', value: '30' }, { label: '+40g (refeição)', value: '40' }],
    history: [
      { label: 'Almoço', value: '48 g' }, { label: 'Café', value: '28 g' }, { label: 'Lanche', value: '12 g' },
    ],
    insight: 'Média de 1.6 g/kg — bom pra hipertrofia. Consistência nos dias de treino é o foco.',
  },
}

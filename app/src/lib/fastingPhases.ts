/**
 * Conteúdo educativo das fases do jejum — portado do app encorpeisaude original.
 * Não substitui orientação médica.
 */

export interface FastingPhaseRich {
  hour: number
  endHour: number
  title: string
  shortTitle: string
  description: string
  body: string
  process: string
  emoji: string
  color: string
}

export const FASTING_PHASES_RICH: FastingPhaseRich[] = [
  { hour: 0, endHour: 4, title: 'Início do Jejum', shortTitle: 'Início', description: 'Glicose sanguínea começa a estabilizar.', body: 'Corpo usa glicose do sangue e glicogênio hepático como combustível principal.', process: 'Insulina começa a cair. Digestão finaliza.', emoji: '⏱️', color: '#3B82F6' },
  { hour: 4, endHour: 8, title: 'Transição Metabólica', shortTitle: 'Transição', description: 'Insulina diminui. Corpo começa a acessar gordura.', body: 'Insulina cai significativamente. Corpo mobiliza ácidos graxos do tecido adiposo.', process: 'Glucagon sobe. Lipólise ativada.', emoji: '⚡', color: '#EAB308' },
  { hour: 8, endHour: 12, title: 'Queima de Gordura Ativa', shortTitle: 'Queima', description: 'Glicogênio esgotando. Lipólise acelera.', body: 'Glicogênio esgotando. Lipólise acelera. Ácidos graxos livres alimentam músculos e órgãos.', process: 'Gordura vira combustível primário.', emoji: '🔥', color: '#F97316' },
  { hour: 12, endHour: 16, title: 'Cetose Leve', shortTitle: 'Cetose', description: 'Corpo produz cetonas. Clareza mental melhora.', body: 'Fígado produz corpos cetônicos (BHB). Cérebro usa cetonas. Clareza mental melhora.', process: 'Cetonas no sangue. Energia estável.', emoji: '🧠', color: '#A855F7' },
  { hour: 16, endHour: 18, title: 'Autofagia Iniciada', shortTitle: 'Autofagia', description: 'Células reciclam componentes danificados.', body: 'Células ativam reciclagem interna. Proteínas danificadas degradadas e reutilizadas.', process: 'mTOR inibido. AMPK ativado.', emoji: '♻️', color: '#22C55E' },
  { hour: 18, endHour: 20, title: 'Hormônio do Crescimento', shortTitle: 'HGH', description: 'HGH aumenta significativamente.', body: 'GH aumenta até 5x. Preservação muscular e queima de gordura acelerada.', process: 'Pico de HGH. Anti-envelhecimento.', emoji: '✨', color: '#EC4899' },
  { hour: 20, endHour: 24, title: 'Autofagia Profunda', shortTitle: 'Limpeza', description: 'Limpeza celular intensa. Inflamação reduz.', body: 'Limpeza celular intensa. Sistema imune se renova. Inflamação sistêmica reduz.', process: 'Reciclagem máxima. Anti-inflamatório.', emoji: '🛡️', color: '#06B6D4' },
  { hour: 24, endHour: 48, title: 'Regeneração Máxima', shortTitle: 'Regeneração', description: 'Autofagia em pico. Reset metabólico completo.', body: 'Autofagia em pico. Reset metabólico completo. Benefícios cardiovasculares e neurológicos.', process: 'Cetose profunda. BDNF aumentado.', emoji: '❤️‍🔥', color: '#EF4444' },
]

export function richPhaseAt(hours: number): FastingPhaseRich {
  const h = Math.max(0, hours)
  return FASTING_PHASES_RICH.find((p) => h >= p.hour && h < p.endHour) ?? FASTING_PHASES_RICH[FASTING_PHASES_RICH.length - 1]
}

export interface FastingPlanRich {
  hours: number
  title: string
  sub: string
  benefit: string
  requiresMedical: boolean
  type: 'intermittent' | 'extended'
}

export const FASTING_PLANS_RICH: FastingPlanRich[] = [
  { hours: 12, title: '12:12', sub: 'Iniciante', benefit: 'Estabiliza glicose e inicia queima de gordura.', requiresMedical: false, type: 'intermittent' },
  { hours: 14, title: '14:10', sub: 'Leve', benefit: 'Acelera lipólise. Melhora sensibilidade à insulina.', requiresMedical: false, type: 'intermittent' },
  { hours: 16, title: '16:8', sub: 'Popular', benefit: 'Autofagia + clareza mental + queima de gordura.', requiresMedical: false, type: 'intermittent' },
  { hours: 18, title: '18:6', sub: 'Avançado', benefit: 'HGH elevado. Perda de peso acelerada.', requiresMedical: false, type: 'intermittent' },
  { hours: 20, title: '20:4', sub: 'Intenso', benefit: 'Autofagia profunda. Reset metabólico.', requiresMedical: false, type: 'intermittent' },
  { hours: 24, title: '24h', sub: '1 dia', benefit: 'Regeneração máxima. Pico de autofagia.', requiresMedical: false, type: 'intermittent' },
  { hours: 36, title: '36h', sub: '1,5 dias', benefit: 'Estabilidade energética e autofagia avançando.', requiresMedical: false, type: 'intermittent' },
  { hours: 48, title: '48h', sub: '2 dias', benefit: 'Cetose profunda. Reciclagem celular ativa.', requiresMedical: true, type: 'extended' },
  { hours: 60, title: '60h', sub: '2,5 dias', benefit: 'Adaptação metabólica avançada. Atenção ao corpo.', requiresMedical: true, type: 'extended' },
  { hours: 72, title: '72h', sub: '3 dias', benefit: 'Limpeza celular profunda. Ajustes hormonais.', requiresMedical: true, type: 'extended' },
  { hours: 96, title: '96h', sub: '4 dias', benefit: 'Reajuste de vias metabólicas.', requiresMedical: true, type: 'extended' },
  { hours: 120, title: '120h', sub: '5 dias', benefit: 'Reset metabólico máximo.', requiresMedical: true, type: 'extended' },
]

export type FastingPhaseSeverity = 'safe' | 'caution' | 'medical'

export interface FastingPhaseDetailed {
  startHour: number
  endHour: number
  range: string
  title: string
  description: string
  focus: string
  severity: FastingPhaseSeverity
}

export const FASTING_PHASES_DETAILED: FastingPhaseDetailed[] = [
  { startHour: 0, endHour: 4, range: '0 - 4h', title: 'Digestão e Absorção', description: 'O corpo ainda está digerindo os alimentos da última refeição. A insulina permanece elevada.', focus: 'Digestão', severity: 'safe' },
  { startHour: 4, endHour: 8, range: '4 - 8h', title: 'Queda da Glicose', description: 'Os níveis de glicose começam a cair e o corpo passa a usar energia armazenada.', focus: 'Energia', severity: 'safe' },
  { startHour: 8, endHour: 12, range: '8 - 12h', title: 'Queima de Glicogênio', description: 'O organismo usa reservas de glicogênio do fígado e músculos como combustível.', focus: 'Reserva energética', severity: 'safe' },
  { startHour: 12, endHour: 16, range: '12 - 16h', title: 'Transição Metabólica', description: 'A insulina cai e o corpo começa a aumentar o uso de gordura como fonte de energia.', focus: 'Lipólise', severity: 'safe' },
  { startHour: 16, endHour: 20, range: '16 - 20h', title: 'Cetose Inicial', description: 'A produção de corpos cetônicos começa. Pode haver melhora de foco e clareza mental.', focus: 'Cetose', severity: 'safe' },
  { startHour: 20, endHour: 24, range: '20 - 24h', title: 'Autofagia Inicial', description: 'O corpo intensifica processos de limpeza celular e reaproveitamento de componentes danificados.', focus: 'Reparação', severity: 'safe' },
  { startHour: 24, endHour: 28, range: '24 - 28h', title: 'Cetose Mais Ativa', description: 'A gordura passa a ser uma fonte mais relevante de energia. A fome pode oscilar.', focus: 'Gordura como energia', severity: 'safe' },
  { startHour: 28, endHour: 32, range: '28 - 32h', title: 'Sensibilidade à Insulina', description: 'A sensibilidade à insulina pode melhorar, dependendo do perfil individual.', focus: 'Metabolismo', severity: 'safe' },
  { startHour: 32, endHour: 36, range: '32 - 36h', title: 'Estabilidade Energética', description: 'Muitas pessoas relatam energia mais estável após adaptação ao jejum.', focus: 'Estabilidade', severity: 'safe' },
  { startHour: 36, endHour: 40, range: '36 - 40h', title: 'Autofagia Avançando', description: 'Processos celulares de manutenção continuam mais ativos.', focus: 'Renovação celular', severity: 'safe' },
  { startHour: 40, endHour: 44, range: '40 - 44h', title: 'Uso de Gordura', description: 'O corpo depende mais da gordura corporal e dos corpos cetônicos.', focus: 'Lipólise avançada', severity: 'safe' },
  { startHour: 44, endHour: 48, range: '44 - 48h', title: 'Jejum Prolongado', description: 'O jejum entra em fase prolongada. Atenção a hidratação, sais minerais e sintomas.', focus: 'Monitoramento', severity: 'caution' },
  { startHour: 48, endHour: 52, range: '48 - 52h', title: 'Cetose Profunda', description: 'O uso de corpos cetônicos pode estar mais elevado. A resposta varia entre pessoas.', focus: 'Cetose profunda', severity: 'caution' },
  { startHour: 52, endHour: 56, range: '52 - 56h', title: 'Economia Metabólica', description: 'O corpo reduz desperdícios energéticos e prioriza funções essenciais.', focus: 'Eficiência', severity: 'caution' },
  { startHour: 56, endHour: 60, range: '56 - 60h', title: 'Atenção Corporal', description: 'Observe tontura, fraqueza, náuseas, palpitações ou mal-estar.', focus: 'Sinais do corpo', severity: 'caution' },
  { startHour: 60, endHour: 64, range: '60 - 64h', title: 'Jejum Avançado', description: 'Fase avançada. Hidratação e eletrólitos se tornam ainda mais importantes.', focus: 'Eletrólitos', severity: 'caution' },
  { startHour: 64, endHour: 68, range: '64 - 68h', title: 'Alta Adaptação', description: 'O corpo está altamente adaptado ao uso de gordura, mas requer cuidado.', focus: 'Adaptação', severity: 'caution' },
  { startHour: 68, endHour: 72, range: '68 - 72h', title: 'Limite de Segurança', description: 'Ao se aproximar de 72h, o jejum deve ser feito com orientação profissional.', focus: 'Segurança', severity: 'caution' },
  { startHour: 72, endHour: 76, range: '72 - 76h', title: 'Acompanhamento Médico', description: 'Jejuns acima de 3 dias devem ser realizados apenas com acompanhamento médico.', focus: 'Atenção médica', severity: 'medical' },
  { startHour: 76, endHour: 80, range: '76 - 80h', title: 'Monitoramento Intensivo', description: 'Acompanhe pressão, sintomas, hidratação, eletrólitos e sinais de alerta.', focus: 'Monitoramento', severity: 'medical' },
  { startHour: 80, endHour: 84, range: '80 - 84h', title: 'Jejum Terapêutico', description: 'Essa fase não deve ser tratada como prática comum sem avaliação profissional.', focus: 'Supervisão', severity: 'medical' },
  { startHour: 84, endHour: 88, range: '84 - 88h', title: 'Risco Aumentado', description: 'O risco de desequilíbrios aumenta. Interrompa se houver sintomas importantes.', focus: 'Segurança', severity: 'medical' },
  { startHour: 88, endHour: 92, range: '88 - 92h', title: 'Atenção Máxima', description: 'Evite esforço físico intenso e mantenha acompanhamento adequado.', focus: 'Cuidado', severity: 'medical' },
  { startHour: 92, endHour: 96, range: '92 - 96h', title: 'Jejum Muito Prolongado', description: 'Essa prática exige orientação médica individualizada.', focus: 'Supervisão médica', severity: 'medical' },
  { startHour: 96, endHour: 100, range: '96 - 100h', title: '4 Dias de Jejum', description: 'Fase extrema para a maioria das pessoas. Requer controle profissional.', focus: 'Controle', severity: 'medical' },
  { startHour: 100, endHour: 104, range: '100 - 104h', title: 'Risco Nutricional', description: 'Pode haver risco de deficiência, queda de energia e desequilíbrio eletrolítico.', focus: 'Nutrição', severity: 'medical' },
  { startHour: 104, endHour: 108, range: '104 - 108h', title: 'Preparação para Quebra', description: 'Planeje a quebra do jejum com alimentos leves e porções pequenas.', focus: 'Reintrodução alimentar', severity: 'medical' },
  { startHour: 108, endHour: 112, range: '108 - 112h', title: 'Cuidado Digestivo', description: 'Após jejuns longos, o retorno alimentar deve ser gradual.', focus: 'Digestão', severity: 'medical' },
  { startHour: 112, endHour: 116, range: '112 - 116h', title: 'Finalização Segura', description: 'Atenção ao momento de encerrar o jejum e evitar exageros alimentares.', focus: 'Segurança alimentar', severity: 'medical' },
  { startHour: 116, endHour: 120, range: '116 - 120h', title: '5 Dias de Jejum', description: 'Limite máximo do painel. Deve ocorrer somente com acompanhamento médico.', focus: 'Acompanhamento médico', severity: 'medical' },
]

export function findCurrentPhase(elapsedHours: number): FastingPhaseDetailed | null {
  if (elapsedHours < 0) return null
  const clamped = Math.min(elapsedHours, 119.999)
  return FASTING_PHASES_DETAILED.find((p) => clamped >= p.startHour && clamped < p.endHour) ?? null
}

export function findCurrentPhaseIndex(elapsedHours: number): number {
  if (elapsedHours < 0) return -1
  const clamped = Math.min(elapsedHours, 119.999)
  return FASTING_PHASES_DETAILED.findIndex((p) => clamped >= p.startHour && clamped < p.endHour)
}

export const QUICK_TIPS = [
  { emoji: '💧', title: 'Hidratação', description: 'Beba água e chás' },
  { emoji: '🚶', title: 'Atividade', description: 'Caminhadas leves OK' },
  { emoji: '🧂', title: 'Eletrólitos', description: 'Sódio, potássio, Mg' },
  { emoji: '⚡', title: 'Alerta', description: 'Pare se sentir tontura' },
]

export const SEVERITY_STYLE: Record<FastingPhaseSeverity, { label: string; color: string; bg: string }> = {
  safe: { label: 'Seguro', color: '#0E9F6E', bg: 'rgba(18,201,138,0.12)' },
  caution: { label: 'Atenção', color: '#D97706', bg: 'rgba(217,119,6,0.12)' },
  medical: { label: 'Supervisão médica', color: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
}

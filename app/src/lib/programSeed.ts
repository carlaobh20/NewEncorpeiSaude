// Programa real do Carlos (110kg, 1,97m, coluna sensível, cutting preservando massa).
// 45 min: 5' aquecimento + 35' musculação + cardio 10' ao final.
export type SeedExercise = { name: string; muscle: string; sets: number; reps: string; rest: number; note?: string }
export type SeedRoutine = { key: string; name: string; focus: string; day: number; cardio: number; muscles: string[]; exercises: SeedExercise[] }

const C = 90, I = 60 // descanso composto / isolado

export const program: SeedRoutine[] = [
  { key: 'SEG', name: 'Segunda · Peito e Tríceps', focus: 'Peito + Tríceps', day: 1, cardio: 10, muscles: ['peito', 'triceps'], exercises: [
    { name: 'Supino máquina', muscle: 'Peito', sets: 4, reps: '10', rest: C, note: 'Peso crescente: leve → médio → pesado → repetir o pesado' },
    { name: 'Supino inclinado halteres', muscle: 'Peito', sets: 3, reps: '10', rest: C, note: 'Mesmo peso nas três séries' },
    { name: 'Crucifixo máquina', muscle: 'Peito', sets: 3, reps: '12', rest: I, note: 'Peso constante · contração máxima' },
    { name: 'Crossover', muscle: 'Peito', sets: 3, reps: '15', rest: I, note: 'Peso moderado · movimento lento' },
    { name: 'Tríceps corda', muscle: 'Tríceps', sets: 3, reps: '12', rest: I, note: 'Última série até quase falhar' },
    { name: 'Tríceps francês', muscle: 'Tríceps', sets: 3, reps: '10', rest: I, note: 'Peso constante' },
  ] },
  { key: 'TER', name: 'Terça · Costas e Bíceps', focus: 'Costas + Bíceps', day: 2, cardio: 10, muscles: ['costas', 'biceps'], exercises: [
    { name: 'Puxada frente', muscle: 'Costas', sets: 4, reps: '10', rest: C, note: 'Peso crescente' },
    { name: 'Remada baixa', muscle: 'Costas', sets: 3, reps: '10', rest: C, note: 'Peso constante' },
    { name: 'Remada articulada', muscle: 'Costas', sets: 3, reps: '12', rest: C, note: 'Peso constante' },
    { name: 'Pulldown', muscle: 'Costas', sets: 3, reps: '15', rest: I, note: 'Pouco peso · foco na contração' },
    { name: 'Rosca direta', muscle: 'Bíceps', sets: 3, reps: '10', rest: I, note: 'Peso constante' },
    { name: 'Rosca martelo', muscle: 'Bíceps', sets: 3, reps: '12', rest: I, note: 'Peso constante' },
  ] },
  { key: 'QUA', name: 'Quarta · Pernas', focus: 'Pernas completo', day: 3, cardio: 10, muscles: ['perna', 'gluteo', 'panturrilha'], exercises: [
    { name: 'Leg Press', muscle: 'Quadríceps', sets: 4, reps: '12', rest: C, note: 'Peso crescente · nunca travar os joelhos' },
    { name: 'Cadeira extensora', muscle: 'Quadríceps', sets: 3, reps: '15', rest: I, note: 'Última série drop set: 40 → 30 → 20 kg, sem descanso' },
    { name: 'Mesa flexora', muscle: 'Posterior', sets: 4, reps: '12', rest: C, note: 'Peso constante' },
    { name: 'Panturrilha no Leg Press', muscle: 'Panturrilha', sets: 4, reps: '20', rest: I, note: 'Segurar 2 segundos em cima' },
    { name: 'Cadeira abdutora', muscle: 'Glúteo', sets: 3, reps: '15', rest: I },
    { name: 'Cadeira adutora', muscle: 'Adutores', sets: 3, reps: '15', rest: I },
  ] },
  { key: 'QUI', name: 'Quinta · Ombros', focus: 'Ombros + Abdômen', day: 4, cardio: 10, muscles: ['ombro', 'core'], exercises: [
    { name: 'Desenvolvimento máquina', muscle: 'Ombro', sets: 4, reps: '10', rest: C, note: 'Peso crescente' },
    { name: 'Elevação lateral', muscle: 'Ombro', sets: 4, reps: '12', rest: I, note: 'Pouco peso · execução perfeita' },
    { name: 'Elevação frontal', muscle: 'Ombro', sets: 3, reps: '12', rest: I },
    { name: 'Crucifixo invertido', muscle: 'Ombro posterior', sets: 3, reps: '15', rest: I },
    { name: 'Encolhimento', muscle: 'Trapézio', sets: 4, reps: '15', rest: I, note: 'Pesado' },
    { name: 'Abdominal máquina', muscle: 'Abdômen', sets: 4, reps: '15', rest: I },
  ] },
  { key: 'SEX', name: 'Sexta · Full Body e Braços', focus: 'Corpo inteiro + Braços', day: 5, cardio: 10, muscles: ['peito', 'costas', 'perna', 'ombro'], exercises: [
    { name: 'Supino máquina', muscle: 'Peito', sets: 3, reps: '12', rest: C },
    { name: 'Puxada frente', muscle: 'Costas', sets: 3, reps: '12', rest: C },
    { name: 'Leg Press', muscle: 'Pernas', sets: 3, reps: '15', rest: C },
    { name: 'Rosca direta', muscle: 'Bíceps', sets: 3, reps: '12', rest: I },
    { name: 'Tríceps corda', muscle: 'Tríceps', sets: 3, reps: '12', rest: I },
    { name: 'Elevação lateral', muscle: 'Ombro', sets: 3, reps: '15', rest: I },
    { name: 'Abdominal', muscle: 'Abdômen', sets: 4, reps: '20', rest: I },
  ] },
]

// Programa real do Carlos — semeado no login na primeira vez.
export type SeedExercise = { name: string; muscle: string; sets: number; reps: string; rest: number }
export type SeedRoutine = { key: string; name: string; focus: string; day: number; cardio: number; muscles: string[]; exercises: SeedExercise[] }

const abs: SeedExercise[] = [
  { name: 'Elevação de pernas', muscle: 'Abdômen', sets: 3, reps: '15', rest: 45 },
  { name: 'Crunch máquina', muscle: 'Abdômen', sets: 3, reps: '20', rest: 45 },
  { name: 'Prancha', muscle: 'Core', sets: 3, reps: '45-60s', rest: 45 },
]

export const program: SeedRoutine[] = [
  { key: 'A', name: 'Treino A · Peito, Ombro e Tríceps', focus: 'Peito + Ombro + Tríceps', day: 1, cardio: 15, muscles: ['peito', 'ombro', 'triceps'], exercises: [
    { name: 'Supino reto máquina', muscle: 'Peito', sets: 4, reps: '8-10', rest: 75 },
    { name: 'Supino inclinado halteres', muscle: 'Peito', sets: 4, reps: '10', rest: 75 },
    { name: 'Crucifixo máquina', muscle: 'Peito', sets: 3, reps: '12', rest: 45 },
    { name: 'Desenvolvimento máquina', muscle: 'Ombro', sets: 4, reps: '10', rest: 60 },
    { name: 'Elevação lateral', muscle: 'Ombro', sets: 4, reps: '12-15', rest: 45 },
    { name: 'Tríceps corda', muscle: 'Tríceps', sets: 4, reps: '12', rest: 45 },
    { name: 'Tríceps francês', muscle: 'Tríceps', sets: 3, reps: '12', rest: 45 },
    ...abs,
  ] },
  { key: 'B', name: 'Treino B · Costas e Bíceps', focus: 'Costas + Bíceps', day: 2, cardio: 15, muscles: ['costas', 'biceps'], exercises: [
    { name: 'Puxada frente', muscle: 'Costas', sets: 4, reps: '10', rest: 75 },
    { name: 'Remada baixa', muscle: 'Costas', sets: 4, reps: '10', rest: 75 },
    { name: 'Remada articulada', muscle: 'Costas', sets: 4, reps: '12', rest: 60 },
    { name: 'Pulldown', muscle: 'Costas', sets: 3, reps: '12', rest: 45 },
    { name: 'Rosca direta', muscle: 'Bíceps', sets: 4, reps: '10', rest: 45 },
    { name: 'Rosca alternada', muscle: 'Bíceps', sets: 3, reps: '12', rest: 45 },
    { name: 'Rosca martelo', muscle: 'Bíceps', sets: 3, reps: '12', rest: 45 },
  ] },
  { key: 'C', name: 'Treino C · Pernas', focus: 'Pernas completo', day: 3, cardio: 20, muscles: ['perna', 'panturrilha', 'gluteo'], exercises: [
    { name: 'Leg Press', muscle: 'Quadríceps', sets: 4, reps: '12', rest: 90 },
    { name: 'Agachamento Hack', muscle: 'Quadríceps', sets: 4, reps: '10', rest: 90 },
    { name: 'Cadeira extensora (última drop set)', muscle: 'Quadríceps', sets: 4, reps: '15', rest: 60 },
    { name: 'Mesa flexora', muscle: 'Posterior', sets: 4, reps: '12', rest: 60 },
    { name: 'Cadeira flexora', muscle: 'Posterior', sets: 3, reps: '12', rest: 45 },
    { name: 'Panturrilha em pé', muscle: 'Panturrilha', sets: 5, reps: '15', rest: 45 },
    { name: 'Panturrilha sentada', muscle: 'Panturrilha', sets: 4, reps: '20', rest: 45 },
    ...abs,
  ] },
  { key: 'D', name: 'Treino D · Ombro completo e Braços', focus: 'Ombro + Braços', day: 4, cardio: 15, muscles: ['ombro', 'biceps', 'triceps'], exercises: [
    { name: 'Desenvolvimento halteres', muscle: 'Ombro', sets: 4, reps: '10', rest: 75 },
    { name: 'Elevação lateral', muscle: 'Ombro', sets: 4, reps: '15', rest: 45 },
    { name: 'Elevação frontal', muscle: 'Ombro', sets: 3, reps: '12', rest: 45 },
    { name: 'Peck Deck inverso', muscle: 'Ombro posterior', sets: 4, reps: '12', rest: 45 },
    { name: 'Rosca Scott', muscle: 'Bíceps', sets: 4, reps: '10', rest: 45 },
    { name: 'Rosca martelo', muscle: 'Bíceps', sets: 3, reps: '12', rest: 45 },
    { name: 'Tríceps testa', muscle: 'Tríceps', sets: 4, reps: '10', rest: 45 },
    { name: 'Tríceps corda', muscle: 'Tríceps', sets: 3, reps: '15', rest: 45 },
  ] },
  { key: 'E', name: 'Treino E · Full Body Metabólico', focus: 'Circuito · 3-4 voltas sem descanso', day: 5, cardio: 0, muscles: ['peito', 'costas', 'perna', 'ombro'], exercises: [
    { name: 'Supino máquina', muscle: 'Peito', sets: 3, reps: '12', rest: 0 },
    { name: 'Remada', muscle: 'Costas', sets: 3, reps: '12', rest: 0 },
    { name: 'Leg Press', muscle: 'Pernas', sets: 3, reps: '15', rest: 0 },
    { name: 'Desenvolvimento', muscle: 'Ombro', sets: 3, reps: '12', rest: 0 },
    { name: 'Pulldown', muscle: 'Costas', sets: 3, reps: '12', rest: 0 },
    { name: 'Mesa flexora', muscle: 'Posterior', sets: 3, reps: '15', rest: 0 },
    { name: 'Bíceps', muscle: 'Bíceps', sets: 3, reps: '12', rest: 0 },
    { name: 'Tríceps', muscle: 'Tríceps', sets: 3, reps: '12', rest: 90 },
    ...abs,
  ] },
]

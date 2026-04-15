import { POINTS, EXACT_SCORE_PHASES } from '../data/worldCupData';

// Calcula el resultado real de un partido
export const getMatchResult = (result) => {
  if (!result) return null;
  if (result.teamAScore > result.teamBScore) return 'teamA';
  if (result.teamBScore > result.teamAScore) return 'teamB';
  return 'draw';
};

// Calcula puntos de una predicción comparada con el resultado real
export const calculatePredictionPoints = (prediction, match) => {
  if (!match.result || !prediction) return 0;

  let points = 0;
  const realResult = getMatchResult(match.result);
  const predResult = prediction.result; // 'teamA', 'teamB', 'draw'

  // 3 puntos por acertar resultado
  if (predResult === realResult) {
    points += POINTS.CORRECT_RESULT;
  }

  // 5 puntos por marcador exacto (solo fases habilitadas)
  if (
    EXACT_SCORE_PHASES.includes(match.phase) &&
    prediction.teamAScore !== undefined &&
    prediction.teamBScore !== undefined &&
    prediction.teamAScore === match.result.teamAScore &&
    prediction.teamBScore === match.result.teamBScore
  ) {
    points += POINTS.EXACT_SCORE;
  }

  return points;
};

// Calcula puntos de avance de grupos (1 punto por equipo que avanzó que el jugador predijo)
export const calculateGroupAdvancePoints = (predictions, advancedTeams) => {
  if (!predictions || !advancedTeams) return 0;
  return predictions.filter(team => advancedTeams.includes(team)).length * POINTS.TEAM_ADVANCES;
};

// Formatea puntos para mostrar
export const formatPoints = (pts) => `${pts} pt${pts !== 1 ? 's' : ''}`;

// Obtiene iniciales del nombre para el avatar
export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

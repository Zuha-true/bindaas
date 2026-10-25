import { ROUTES } from '../constants/routes';

export const skinRoutes = {
  bindaas: { home: ROUTES.hub, pantry: ROUTES.settings, calculator: ROUTES.calculator },
  tadka: { home: ROUTES.tadka, pantry: ROUTES.tadkaPantry, recipeBox: ROUTES.tadkaBox },
} as const;

export function getSkinRoutes(skin: 'bindaas' | 'tadka') { return skinRoutes[skin]; }

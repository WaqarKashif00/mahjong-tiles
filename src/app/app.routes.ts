import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },
  {
    path: 'game',
    loadComponent: () =>
      import('./features/game/game.component').then((m) => m.GameComponent),
  },
  {
    path: 'game-over',
    loadComponent: () =>
      import('./features/game-over/game-over.component').then(
        (m) => m.GameOverComponent
      ),
  },
  { path: '**', redirectTo: '' },
];

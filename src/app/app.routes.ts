import { Routes } from '@angular/router';
import { VisorComponent } from './pages/visor/visor.component';
import { ControlComponent } from './pages/control/control.component';

export const routes: Routes = [
  { path: '', redirectTo: 'visor', pathMatch: 'full' },
  { path: 'visor', component: VisorComponent },
  { path: 'control', component: ControlComponent },
];

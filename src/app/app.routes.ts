import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Events } from './events/events';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', component: Login },
  { path: 'events', component: Events },
];

// vienkarsi iezimeju marsrutus pa kuriem pludis dati
// src/app/globalSignals/user-global-signal.ts
import { Injectable, signal } from '@angular/core';
import { userDTO } from '../models/user-dto';

@Injectable({
  providedIn: 'root',
})
export class UserGlobalSignal {
  userGlobalSignal = signal<userDTO>({
    id: null,
    username: '',
  });
}

// shis man nodrosinaas globalu piekluvi lietotaja datiem caur signals tieshi username un id (parole nebus globala)
// izmainas, kas veiktas atspogulosies visur
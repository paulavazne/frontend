import { Component, inject, signal } from '@angular/core';
import {
  form,
  maxLength,
  minLength,
  required,
  Field,
  pattern
} from '@angular/forms/signals';
import { Router } from '@angular/router';

import { UserModel } from '../models/user-model';
import { UserService } from '../services/user-service';
import { UserGlobalSignal } from '../globalSignals/user-global-signal';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [Field],
  templateUrl: './login.html',
})
export class Login {
// injeceju servisus. router bus navigacijai, userservice atbild par api-register un login. userglobal id un username globali
  router = inject(Router);
  userService = inject(UserService);
  globalUser = inject(UserGlobalSignal);

  //signals ar usera datiem. sakuma vertiba, sheit glabasies dti no formas. 
  userSignal = signal<UserModel>({
    id: null,
    username: '',
    password: '',
    registeredEvents: 0,
    attendedEvents: 0,
  });

  //forma ar validacijam
  loginForm = form(this.userSignal, (p) => {
    // lietotajvards
    required(p.username, { message: 'Lietotājvārds ir obligāts' });
    minLength(p.username, 3, {
      message: 'Lietotājvārdam jābūt vismaz 3 simbolus garam',
    });
    maxLength(p.username, 20, {
      message: 'Lietotājvārds nedrīkst pārsniegt 20 simbolus',
    });

    // parole
    required(p.password, { message: 'Parole ir obligāta' });
    minLength(p.password, 8, {
      message: 'Parolei jābūt vismaz 8 simbolus garai',
    });
    maxLength(p.password, 100, {
      message: 'Parole nedrīkst pārsniegt 100 simbolus',
    });
   
  });
// login - parbaudu, vai forma ir deriga, sutu post uz serveri un ja atbilde ir, tad atjauninu globalsignal ar jaunajiem datiem un novirzu talak uz /events
  logInUser(user: UserModel) {
    console.log('Login attempt:', user);

    if (!this.loginForm().valid()) {
      console.log('Wrong form');
      return;
    }

    this.userService.login(user).subscribe({
      next: (response) => {
        console.log('Login response:', response);

        // id un usernamu saglabashu globalaja signalaa
        this.globalUser.userGlobalSignal.update(() => ({
          id: response.id ?? null,
          username: response.username ?? '',
        }));

        //uz event page
        this.router.navigate(['/events']);
        console.log('Global user:', this.globalUser.userGlobalSignal());
      },
      error: (err) => {
        if (err.status === 401) {
          console.error('Wrong username or password');
          alert('Nepareizs lietotājvārds vai parole');
        } else {
          console.log('Login kļūda', err);
          alert('Neizdevās pieslēgties pie servera');
        }
      },
    });
  }

  // registrejamies
  // valideju formu, sutu datus uz serveri un display message, ka viss ir ok. tad kad veiksmigi pieregistrejos, atstaju credentials un lauju uzreiz vnk pieslegties
  signUpUser() {
    if (!this.loginForm().valid()) {
      console.log('Wrong form for registration');
      return;
    }

    const value = this.loginForm().value();

    this.userService.register(value).subscribe({
      next: (saved) => {
        console.log('Saglabāts lietotājs:', saved);
        alert('Reģistrācija veiksmīga! Tagad vari pieslēgties.');
      },
      error: (err) => {
        console.log('Reģistrācijas kļūda', err);
        alert('Neizdevās piereģistrēties.');
      },
    });
  }

  //poga pieslegties
  onClick() {
    this.logInUser(this.loginForm().value());
  }

  //poga register
  goToRegister() {
    this.signUpUser();
  }
}
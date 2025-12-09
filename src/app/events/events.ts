import { Component, inject, OnInit, signal } from '@angular/core';
import { Field, form, required, minLength, maxLength } from '@angular/forms/signals';
import { EventsService } from '../services/events-service';
import { EventModel } from '../models/event-model';
import { UserGlobalSignal } from '../globalSignals/user-global-signal';
import { CommonModule, DatePipe } from '@angular/common';

// attelos visus pasakumus, izveidoshu validato formu, jauns,piesledzos,atsakos. te vajag field un form
@Component({
  selector: 'app-events',
  standalone: true,
  imports: [DatePipe, CommonModule, Field],
  templateUrl: './events.html',
})
export class Events implements OnInit {

  // injeceju, lai eventservice un userglobal pieejami komponentee. 
  // eventservice ar backendapi get,create,registercancel. userglobal satur pieteikušos globālo lietotāju
  private eventsService = inject(EventsService);
  readonly userGlobal = inject(UserGlobalSignal);

  // uzstadu formatu un to lai nevar izveleties shodienu
  today = new Date().toISOString().split('T')[0];

  // sis bus reaktivais signals, kura glabasies visi pasakumi no servera
  eventsSignal = signal<EventModel[]>([]);

  // vnk vertibas ko fomra ievadits
  eventSignal = signal({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: 1,
  });

  // field formas validacijas
  eventForm = form(this.eventSignal, (f) => {
    required(f.title, { message: 'Nosaukums ir obligāts' });
    minLength(f.title, 3, { message: 'Vismaz 3 simboli' });
    maxLength(f.title, 100, { message: 'Maks. 100 simboli' });

    required(f.description, { message: 'Apraksts ir obligāts' });
    minLength(f.description, 5, { message: 'Vismaz 5 simboli' });

    required(f.date, { message: 'Datums ir obligāts' });
    required(f.time, { message: 'Laiks ir obligāts' });

    required(f.location, { message: 'Vieta ir obligāta' });
    required(f.maxParticipants, { message: 'Max cilvēku skaits ir obligāts' });
  });

  // inicializacjija
  ngOnInit(): void {
    this.loadEvents();
  }

  // ieladesu visus eventus
  loadEvents(): void {
    this.eventsService.getAllEvents().subscribe({
      next: (events) => this.eventsSignal.set(events),
      error: (err) => console.error('Error loading events', err),
    });
  }

  // izveidoju jaunu
  createEvent(): void {
    if (!this.eventForm().valid()) return;

    const formValue = this.eventForm().value();

    // parbaudu vai lietotajs piesledzies
    const user = this.userGlobal.userGlobalSignal();
    if (!user.id) {
      alert('Lūdzu, pieslēdzies sistēmai, lai varētu izveidot pasākumu vai pieslēgties tam');
      return;
    }

    // izveidoju datuma un laika objektu un parbaudu vai nav pagatne
    const fullDateTime = new Date(`${formValue.date}T${formValue.time}`);
    const now = new Date();

    if (fullDateTime < now) {
      alert('Pasākumu nevar izveidot pagātnē!');
      return;
    }

    // sagatavoju objektu, ko sutit uz backend
    const body: Partial<EventModel> = {
      title: formValue.title,
      description: formValue.description,
      dateTime: fullDateTime.toISOString(),
      location: formValue.location,
      maxParticipants: formValue.maxParticipants,
      createdBy: user.id, // pielieku sho, lai nosutitu ari autora id - palidzes nodrosinat, ka izdzest var tikai atuors
    };

// servisa uztaisiju ka userid sanem atseviski
    this.eventsService.createEvent(body, user.id).subscribe({
      next: (created) => {
        this.eventsSignal.update((list) => [...list, created]);

        // attiru formu
        this.eventSignal.set({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          maxParticipants: 1,
        });

        alert('Apsveicu, tavs pasākums ir veiksmīgi izveidots');
      },
      error: (err) => {
        console.error('Kļūda', err);
        alert('Pasākumu izveidot neizdevās. Mēģini vēlreiz.');
      },
    });
  }

  // piesakos
  registerForEvent(event: EventModel): void {
    const user = this.userGlobal.userGlobalSignal();
    const userId = user.id ?? null;
    if (!event.id || !userId) return;
// no globala signala ieguvu pasreizejo lietotaju. 
    const alreadyRegistered = event.participantIds?.includes(userId);
    const isFull = event.currentParticipants >= event.maxParticipants;
    if (alreadyRegistered || isFull) return;
// parbauda vai userid ir jau registrejies jeb datubaze zem participantids
// is full parbauda vai dalibnieku skaits ir sasniedzis maxparticipants
// ja kads no siem check, tad funkcija beidzas bez darbibas. 
    this.eventsService.registerForEvent(event.id, userId).subscribe({
    //  izsaucu registerforevent metodi eventsservice klase, kas sutis pieprasijumu uz bakendu - put uz events/event id.register/userid
      next: (updated) => {
        this.eventsSignal.update((list) =>
          list.map((e) => (e.id === updated.id ? updated : e))
        );
      },
  // kad ieregistrejos tad next frontend saraksts eventssignal atjaunojas un nomaina veco uz updated
  // ar .map atrodu isto event.id un aizvietoju ari ar jauno. 
      error: (err) => console.error('Error registering', err),
    });
  }

  // autors var izdzēst savu pasākumu
 deleteEvent(eventId: number): void {
  const user = this.userGlobal.userGlobalSignal();
  if (!user.id) return;
// panemu globalo lietotaju no userglobalsignal. ja lietotajs nav piesledzies (nav userid), funkciju partraucam
  const event = this.eventsSignal().find(e => e.id === eventId);
  if (!event) return;
// atrodu pasakumu pec eventid no lokala eventssignal saraksa. ja pasakumu neatrodu - funkcija atkal apstaies
  if (event.createdBy !== user.id) {
    alert('Atvaino, bet pasākumu var rediģēt un dzēst tikai tā autors');
    return;
  }
// parbaudu autorizaciju. lietotajs vares izdzest pasakumu tad, ja bus autors - jeb createdby == userid
  if (!confirm('Vai esi drošs, ka pasākumu vēlies dzēst?')) return;
// ja neapstiprinas nedzesis un bus retunr
  // TE IR PĀRSŪTĪTS ARĪ user.id
  this.eventsService.deleteEvent(eventId, user.id).subscribe({
  // uz bakendu sutu dzesanas prasijumu kopa ar eventid- kurs pasakums, userid - kurs megina. bakend pec siem parametriem valdies vai sis lietotajs driskt dzest pasakumu
    next: () => {
      this.eventsSignal.update(events => events.filter(e => e.id !== eventId));
      alert('Pasākums izdzēsts neatgriezenisi');
    },
    // ja bakend apstiprina, tad pasakumu no frontend iznemu ar filter un lietotajs sanem pazinojumu
    error: (err) => {
      console.error('Kļūda', err);
      alert('Pasākumu neizdevās dzēst :(');
    }
  });
}

  // atsakos no pasākuma
  cancelRegistration(event: EventModel): void {
    const user = this.userGlobal.userGlobalSignal();
    const userId = user.id ?? null;
    if (!event.id || !userId) return;
// parbaudu vai lietotajs piesledzies un pasakumam ir id. 
    const alreadyRegistered = event.participantIds?.includes(userId);
    if (!alreadyRegistered) return;
// parbaudu vai userid ir pararticipantid saraksta
    this.eventsService.cancelRegistration(event.id, userId).subscribe({
      next: (updated) => {
        this.eventsSignal.update((list) =>
          list.map((e) => (e.id === updated.id ? updated : e))
        );
      },
      error: (err) => console.error('Error cancelling', err),
    });
// sutu put pieprasijumu uz /events/id/cancel/userid. ja viss ok tad samazinasies ciparins, ja bus problema, paradisies logs
  }

  // pārbauda vai event ir pilns
  isEventFull(event: EventModel): boolean {
    return event.currentParticipants >= event.maxParticipants;
  }

  // parbaudu vai ir pieregistrejies?
  isUserRegistered(event: EventModel): boolean {
    const userId = this.userGlobal.userGlobalSignal().id ?? null;
    if (userId == null) return false;
    return !!event.participantIds?.includes(userId);
  }

  // parbauda vai nav pagatne 
  isEventInPast(event: EventModel): boolean {
    if (!event.dateTime) return false;
    return new Date(event.dateTime) < new Date();
  }
}
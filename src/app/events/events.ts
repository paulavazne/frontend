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
  // eventservice ar backendapi get,create,registercancel. useglobal satur pieteikushos global lietotaju
  private eventsService = inject(EventsService); 
  private userGlobal = inject(UserGlobalSignal);
// fomrats un lai nevar sodienu izveleities
  today = new Date().toISOString().split('T')[0];
// shis bus reaktivais signals, kura glabasies visi pasakumi no servera, mainisies, kad bus update vai set
  eventsSignal = signal<EventModel[]>([]);
  // tikai vertibas
  eventSignal = signal({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: 1,
  });

  // field forma validacija
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

  //inicializeju
  ngOnInit(): void {
    this.loadEvents();
  }

  // ieladeju visus eventus
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
    const body = {
      title: formValue.title,
      description: formValue.description,
      dateTime: `${formValue.date}T${formValue.time}`,
      location: formValue.location,
      maxParticipants: formValue.maxParticipants,
    };

    this.eventsService.createEvent(body).subscribe({
      next: (created) => {
        this.eventsSignal.update((list) => [...list, created]);

        // notiiru formu
        this.eventSignal.set({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          maxParticipants: 1,
        });
      },
      error: (err) => console.error('Error creating event', err),
    });
  }

  //piesakos
  registerForEvent(event: EventModel): void {
    const user = this.userGlobal.userGlobalSignal();
    const userId = user.id ?? null;
    if (!event.id || !userId) return;

    // parbaudu vai nav jau pieregistrejies - parbauda vai eventparticipantid jau nav sads userid
    const alreadyRegistered = event.participantIds?.includes(userId);
    // parbaudu, vai nav pilns, ja ir tad return no jauna???
    const isFull = event.currentParticipants >= event.maxParticipants;
    if (alreadyRegistered || isFull) return;

    this.eventsService.registerForEvent(event.id, userId).subscribe({
      next: (updated) => {
        this.eventsSignal.update((list) =>
          list.map((e) => (e.id === updated.id ? updated : e))
        );
      },
      error: (err) => console.error('Error registering', err),
    });
  }

  // atsakos no pasakuma - tas nozime ka, kanceloju registraciju un tieku iznemta ari no eventparticipantid
  cancelRegistration(event: EventModel): void {
    const user = this.userGlobal.userGlobalSignal();
    const userId = user.id ?? null;
    if (!event.id || !userId) return;
// atkal parbaudu vai ir registerejies
    const alreadyRegistered = event.participantIds?.includes(userId);
    if (!alreadyRegistered) return;
// sutu uz bakendu atteikshanas pieprasijumu
    this.eventsService.cancelRegistration(event.id, userId).subscribe({
      next: (updated) => {
        this.eventsSignal.update((list) =>
          list.map((e) => (e.id === updated.id ? updated : e))
        );
      },
      error: (err) => console.error('Error cancelling', err),
    });
  }

  //shis parbaudis vai event ir full
  isEventFull(event: EventModel): boolean {
    return event.currentParticipants >= event.maxParticipants;
  }

  //par jau pieteikushos
  isUserRegistered(event: EventModel): boolean {
    const userId = this.userGlobal.userGlobalSignal().id ?? null;
// sanak parbauda gan null, gan undefined, kas ir globalajaa. ja userid nav, atgriezh false, vai ja participantids nav definets ari ir dalse
    if (userId ==null) return false;
    return !!event.participantIds?.includes(userId);
  }
}
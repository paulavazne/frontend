import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventModel } from '../models/event-model';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
 http = inject(HttpClient);
 private readonly URL: string = "http://localhost:8080/events"
// saknojas htmla
  //visi eventi
  // suta get pieprasijumu uz 8080/events, sagaida atbildi no servera ar visiem pasakumiem. (java tas nonaks uz getmapping getallevents)
  getAllEvents(): Observable<EventModel[]> {
    return this.http.get<EventModel[]>(this.URL);
  }

  // izveidoju
  // suta post uz 8080/events, pieprasijuma body bus pasakuma dati, title, datetime, location utt. (java tas nonaks uz postmaping createevent)
  createEvent(event: Partial<EventModel>): Observable<EventModel> {
    return this.http.post<EventModel>(this.URL, event);
  }

  // piesakos
  // suta put pieprasijumu uz 8080/events, pieprasijuma nebus body bet tikai url (java tas nonaks pie putmapping register. un man atgriezis atjaunotu pasakumu, kur currentparticipants un participantids bus atjaunots)
 registerForEvent(eventId: number, userId: number) {
  return this.http.put<EventModel>(
    `${this.URL}/${eventId}/register/${userId}`,
    {}
  );
  }

  // atcelu
  // suta put pieprasijumu uz 8080/events, cancel. serveris samazinas dalibnieku skaitu(pamainis ciparus) un ari nonems userid no participantids
  cancelRegistration(eventId: number, userId: number) {
  return this.http.put<EventModel>(`${this.URL}/${eventId}/cancel/${userId}`, {});
  }
}
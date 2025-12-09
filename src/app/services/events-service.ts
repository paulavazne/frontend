import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventModel } from '../models/event-model';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  http = inject(HttpClient);
  private readonly URL: string = "http://localhost:8080/events";

  // saknojas htmla

  // visi eventi
  // suta get pieprasijumu uz 8080/events, sagaida atbildi no servera ar visiem pasakumiem. 
  // (java tas nonaks uz getmapping getallevents)
  getAllEvents(): Observable<EventModel[]> {
    return this.http.get<EventModel[]>(this.URL);
  }

  // izveidoju
  // lai varetu ari izdzest byuser
  // suta post uz 8080/events/user/{userId}, pieprasijuma body bus pasakuma dati: title, datetime, location utt. 
  // (java tas nonaks uz postmapping createevent)
  createEvent(event: Partial<EventModel>, userId: number): Observable<EventModel> {
    return this.http.post<EventModel>(`${this.URL}/user/${userId}`, event);
  }

  // piesakos
  // suta PUT pieprasijumu uz 8080/events/{eventId}/register/{userId}, pieprasijuma nebus body, tikai URL.
  // (java tas nonaks uz PUT mapping registerForEvent un atgriez atjaunotu pasakumu)
  registerForEvent(eventId: number, userId: number): Observable<EventModel> {
    return this.http.put<EventModel>(
      `${this.URL}/${eventId}/register/${userId}`,
      {}
    );
  }

  // lai varu izdzēst pasākumu - definēju metodi šeit, lai events.ts to atpazīst
  // nosūta DELETE pieprasījumu uz backendu. Pieņem parametru eventId (skaitlis)
  // un atgriež Observable<void> – asinhronu, kas paziņo, ka dzēšana notika veiksmīgi vai nē.
 deleteEvent(eventId: number, userId: number): Observable<void> {
  return this.http.delete<void>(`${this.URL}/${eventId}/user/${userId}`);
}

  // atceļu reģistrāciju
  // sūta PUT pieprasījumu uz 8080/events/{eventId}/cancel/{userId}. 
  // Serveris samazinās dalībnieku skaitu un noņems userId no participantIds
  cancelRegistration(eventId: number, userId: number): Observable<EventModel> {
    return this.http.put<EventModel>(`${this.URL}/${eventId}/cancel/${userId}`, {});
  }
}
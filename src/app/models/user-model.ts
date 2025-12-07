import { NumberValueAccessor } from "@angular/forms";

export interface UserModel {
  id: number | null;
  username: string;
  password: string;
  registeredEvents?: number;
  attendedEvents?: number;
}
// shie ir tie dati, kurus frontend es apstradasu, kad dati tieks ievaditi forma - login signup. validesu un tad sutisu uz bakenddu ka pilnu objektu. (atskiriba no dto - dto satur tikai tos datus, ko vajag PEC signup login??)
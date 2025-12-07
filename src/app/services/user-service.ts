import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UserModel } from "../models/user-model";

@Injectable({
    providedIn: 'root'
})
export class UserService {
// sazinamies ar bakendu, par login un registraciju
    private readonly URL: string = 'http://localhost:8080/';
// http pieprasijumi uz bakendu
    private http: HttpClient = inject(HttpClient);

    //logins
    // sutam post uz 8080/login. pieprasijuma ir userdata - username un password. safaida atbildi no servera ar usermodel sastavadlam, piem id:1, useernaame: anna, utt
    // bakenda shis nonaks uz @postmapping login
    login(userData: UserModel): Observable<UserModel> {
        return this.http.post<UserModel>(`${this.URL}login`, userData);
    }

    //registeracija
    // sutam post uz 8080/users. atkal userdata bus un sagaida atpakal jaunu usermodel, 
    // bakenda shis bus uz postmapping users
    register(userData: UserModel): Observable<UserModel> {
        return this.http.post<UserModel>(`${this.URL}users`, userData);
    }

}

// izmantoju observale, lai dati tiktu atgriezti no sercera. sitie asinhronie?
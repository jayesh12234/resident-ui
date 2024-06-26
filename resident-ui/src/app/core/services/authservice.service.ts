import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError} from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';


@Injectable()
export class AuthService {

  constructor(private router: Router, private http: HttpClient, private appService: AppConfigService) { }
   rolesString: string ;
   token: string;
   roles: string[];
   isAuthenticated(): Observable<boolean> {
    return this.http.get(`${this.appService.getConfig().baseUrl}/authorize/admin/validateToken`, { observe: 'response'}).
    pipe(map(res => res.status === 200),
    catchError(error => {
      console.log(error);
      return of(false);
    }));
  }

  isLanguagesSet() {
    const primaryLangCode = this.appService.getConfig()['primaryLangCode'];
    if (
      primaryLangCode === null ||
      primaryLangCode === '' || primaryLangCode.length === 0
    ) {
      return false;
    } else {
      return true;
    }
  }
}

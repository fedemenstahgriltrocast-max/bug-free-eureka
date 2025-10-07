/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable, inject } from '@angular/core';

import { ChatMessageModel } from '../../../../../../shared/chatMessageModel';
import { ChatResponseModel } from '../../../../../../shared/chatResponseModel';
import { OrderConfirmationMessage } from '../../../../../../shared/orderConfirmationMessage';

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginService } from './login.service';

const chatUrl = `${environment.backendUrl}/chat`;
const approveUrl = `${environment.backendUrl}/approveOrder`;

@Injectable({
  providedIn: 'root',
})
export class CoffeeService {
  private loginService: LoginService = inject(LoginService);

  constructor(private http: HttpClient) { }

  /**
   * Create Http options that include the latest id token.
   */
  private getHttpOptions() {
    const idToken = this.loginService.idToken();
    const appCheckToken = this.loginService.appCheckToken();    
     
    return { 
      headers: new HttpHeaders({
        'X-Firebase-AppCheck': appCheckToken,
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        Allow: '*'
      }),
      withCredentials: true
    };
  }
  
  sendMessage(request: ChatMessageModel): Observable<ChatResponseModel> {
    return this.http.post<ChatResponseModel>(chatUrl, request, this.getHttpOptions())
    .pipe(
      catchError((err: HttpErrorResponse) => {
        // console.error(err);
        throw err.error;
      }),
      map((data: ChatResponseModel): ChatResponseModel => {
        return data;
      })
    );
  }

  sendOrderApproval(request: OrderConfirmationMessage): Observable<ChatResponseModel>{
    return this.http.post<ChatResponseModel>(approveUrl, request, this.getHttpOptions())
    .pipe(
      catchError((err: HttpErrorResponse) => {
        console.error(err);
        throw err.error;
      }),
      map((data: ChatResponseModel): ChatResponseModel => {
        return data;
      })
    );

  }
}
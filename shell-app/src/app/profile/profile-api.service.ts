import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthUser } from '../auth/auth.service';

const API_BASE_URL = 'http://localhost:8082/api/v1';

export interface UserPreferences {
  emailNotifications: boolean;
  taskReminders: boolean;
  compactView: boolean;
  landingPage: string;
}

export interface UserActivity {
  id: string;
  type: string;
  action: string;
  description?: string;
  recordType?: string;
  recordId?: string;
  recordNumber?: string;
  status?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SearchResult {
  type: string;
  id: string;
  number?: string;
  title: string;
  subtitle?: string;
  status?: string;
  url: string;
  updatedAt?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API_BASE_URL}/profile`);
  }

  updateProfile(payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
  }): Observable<AuthUser> {
    return this.http.put<AuthUser>(`${API_BASE_URL}/profile`, payload);
  }

  changePassword(payload: { currentPassword: string; newPassword: string }): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/profile/password`, payload);
  }

  getPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${API_BASE_URL}/profile/preferences`);
  }

  updatePreferences(payload: UserPreferences): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(`${API_BASE_URL}/profile/preferences`, payload);
  }

  getActivity(size = 50): Observable<UserActivity[]> {
    const params = new HttpParams().set('size', String(size));
    return this.http.get<UserActivity[]>(`${API_BASE_URL}/profile/activity`, { params });
  }

  search(query: string): Observable<SearchResponse> {
    const params = new HttpParams().set('q', query);
    return this.http.get<SearchResponse>(`${API_BASE_URL}/search`, { params });
  }
}

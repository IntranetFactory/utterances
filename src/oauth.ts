import { param } from './deparam';
import { pageAttributes as page } from './page-attributes';

const authorizeUrl = `${page.utterancesApi}/authorize`;
const tokenUrl = `${page.utterancesApi}/token`;
// tslint:disable-next-line:variable-name
const redirect_uri = `${location.origin}/authorized.html`;
const scope = 'public_repo';

class Token {
  private readonly storageKey = 'OAUTH_TOKEN';
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem(this.storageKey);
      // tslint:disable-next-line:no-empty
    } catch (e) { }
  }

  get value() {
    return this.token;
  }
  set value(newValue) {
    this.token = newValue;
    try {
      if (newValue === null) {
        localStorage.removeItem(this.storageKey);
      } else {
        localStorage.setItem(this.storageKey, newValue);
      }
      // tslint:disable-next-line:no-empty
    } catch (e) { }
  }
}

export const token = new Token();

export function login() {
  window.open(`${authorizeUrl}?${param({ scope, redirect_uri })}`);
  return new Promise(resolve => (window as any).notifyAuthorized = resolve)
    .then(() => fetch(tokenUrl, { mode: 'cors', credentials: 'include' }))
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      return response.text().then(text => Promise.reject(`Error retrieving token:\n${text}`));
    })
    .then(t => { token.value = t; }, reason => { token.value = null; throw reason; });
}

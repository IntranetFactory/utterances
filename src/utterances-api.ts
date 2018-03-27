// this is to make ts compiler happy
declare global {
  interface Window {
    utterancesConfig: any
  }
}

let uc: any = window.utterancesConfig;
let apiUrl = uc.hasOwnProperty('utterancesApi') ? uc['utterancesApi'] : 'http://localhost:5000';

export const UTTERANCES_API = apiUrl;

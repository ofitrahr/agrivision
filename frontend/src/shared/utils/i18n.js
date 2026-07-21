import i18n from 'i18next';
import {initReactI18next, Translation} from 'react-i18next';

const resources = {
  en: {
    translation: {
      "welcome": "Welcome to Agrivision",
      "login": "Login"
    }
  },
  id: {
    translation: {
      "welcome": "Selamat datang di Agrivision",
      "login": "Masuk"
    }
  }
};
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'id', 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });
  
export default i18n;
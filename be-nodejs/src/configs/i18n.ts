import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

export const initI18n = async () => {
  await i18next
    .use(Backend)
    .init({
      lng: 'en', // default language
      fallbackLng: 'en',
      debug: false,
      
      backend: {
        loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
      },
      
      interpolation: {
        escapeValue: false, // React already does escaping
      },
    });
};

export const t = async (key: string, options?: any): Promise<string> => {
  const translation = i18next.t(key, options);
  return String(translation);
};

export const changeLanguage = async (lng: string): Promise<void> => {
  await i18next.changeLanguage(lng);
  return;
};


export default i18next;

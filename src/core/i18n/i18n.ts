import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import * as path from 'path';
import { SupportedLanguages } from '../enum/supported-languages.enum';

const i18n = i18next.use(Backend);

export const initI18n = async () => {
    if (i18n.isInitialized) return i18n;

    await i18n.init({
        fallbackLng: SupportedLanguages.CZ,
        supportedLngs: Object.values(SupportedLanguages),
        preload: Object.values(SupportedLanguages),
        backend: {
            loadPath: path.join(__dirname, 'locales/{{lng}}/translation.json'),
        },
        interpolation: {
            escapeValue: false,
        }
    });

    return i18n;
};

export default i18n;

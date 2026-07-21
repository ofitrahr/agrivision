import {useTranslation} from 'react-i18next';
import api from './shared/api/axios';

function app() {
  const { t, i18n } = useTranslation();

  const handleCekAxios = () => {
    alert("Axios base URL: " + api.defaults.baseURL);
  };

  return (
    <div style={{padding: '50px', textAlign: 'center'}}>
        <h1>{t('welcome')}</h1>

    <div style={{ marginTop: '20px', gap: '10px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={() => i18n.changeLanguage('en')}>Bahasa Inggris</button>
        <button onClick={() => i18n.changeLanguage('id')}>Bahasa Indonesia</button>
        <button onClick={handleCekAxios}>Cek Setting Axios</button>
      </div>
    </div>
  ) 
}

export default app;
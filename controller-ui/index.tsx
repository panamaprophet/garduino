import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';
import InputField from './components/InputField';
import Button from './components/Button';
import {getSettings, setSettings, reboot} from './api';
import * as styles from './styles.module.css';


const Application = () => {
    const [ssid, setSSID] = useState('');
    const [password, setPassword] = useState('');
    const [controllerId, setControllerId] = useState('');

    useEffect(() => {
        (async function() {
            const settings = await getSettings();

            setSSID(settings.ssid);
            setPassword(settings.password);
            setControllerId(settings.controllerId);
        })();
    }, []);

    return (
        <div className={styles.root}>
            <section className={styles.section}>
                <InputField onChange={setSSID} label="SSID" value={ssid} />
                <InputField onChange={setPassword} label="Password" value={password} />
                <InputField onChange={setControllerId} label="Controller ID" value={controllerId} />
            </section>

            <section className={styles.section}>
                <Button label="Save" type="dark" onClick={() => setSettings({ssid, password, controllerId})} />
                <Button label="Reboot" onClick={() => reboot()} />
            </section>
        </div>
    );
};


render(
    <Application />, 
    document.getElementById('root')!
);
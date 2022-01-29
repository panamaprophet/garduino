import {render, h} from 'preact';
import {useEffect, useState} from 'preact/hooks';
import InputField from './components/InputField';
import Button from './components/Button';
import SensorData from './components/SensorData';
import {getSettings, setSettings, reboot, getStatus} from './api';
import * as styles from './styles.module.css';


const Application = () => {
    const [ssid, setSSID] = useState('');
    const [password, setPassword] = useState('');
    const [controllerId, setControllerId] = useState('');
    const [status, setStatus] = useState({});

    useEffect(() => {
        (async function() {
            const settings = await getSettings();
            const status = await getStatus();

            setSSID(settings.ssid);
            setPassword(settings.password);
            setControllerId(settings.controllerId);
            setStatus(status);
        })();
    }, []);

    return (
        <div className={styles.root}>
            <section className={styles.section}>
                <InputField onChange={setSSID} label="SSID" value={ssid} />
                <InputField onChange={setPassword} label="Password" value={password} />
                <InputField onChange={setControllerId} label="Controller ID" value={controllerId} />

                <Button label="Save" type="dark" onClick={() => setSettings({ssid, password, controllerId})} />
            </section>

            {status && (
                <section className={styles.section}>
                    {Object
                        .entries(status)
                        .map(([key, value]) => <SensorData name={key} value={value} />)}
                </section>
            )}

            <section className={styles.section}>
                <Button label="Reboot" onClick={() => reboot()} />
            </section>
        </div>
    );
};


render(
    <Application />, 
    document.getElementById('root')!
);
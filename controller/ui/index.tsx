import { render, h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import InputField from './components/InputField';
import Button from './components/Button';
import SensorData from './components/SensorData';
import { getSettings, saveSettings, reboot, getStatus } from './api';
import * as styles from './styles.module.css';


const Application = () => {
    const [status, setStatus] = useState({});
    const [settings, setSettings] = useState<{ [k: string]: string }>({
        ssid: '',
        password: '',
        controllerId: '',
        serverUrl: '',
    });

    useEffect(() => {
        getSettings().then(setSettings);
        getStatus().then(setStatus);
    }, []);

    return (
        <div className={styles.root}>
            <section className={styles.section}>
                {Object
                    .keys(settings)
                    .map((key) =>
                        <InputField
                            key={key}
                            label={key}
                            value={settings[key]}
                            onChange={(value) =>
                                setSettings({ ...settings, [key]: value })
                            }
                        />
                    )
                }

                <Button label="Save" type="dark" onClick={() => saveSettings(settings)} />
            </section>

            <section className={styles.section}>
                {Object
                    .entries(status)
                    .map(([key, value]) => <SensorData name={key} value={value} />)}
            </section>

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

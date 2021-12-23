import {FunctionalComponent} from 'preact';
import * as styles from './styles.module.css';


interface Props { 
    onChange: (value: string) => void,
    label?: string, 
    value?: string,
};


const InputField: FunctionalComponent<Props> = ({onChange, label = '', value = ''}) => {
    return (
        <label className={styles.root}>
            <div className={styles.label}>
                {label}:
            </div>
            <input 
                className={styles.input}
                type="text"
                value={value}
                onChange={event => onChange(event.target.value)}
            />
        </label>
    );
};

export default InputField;
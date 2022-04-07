import { FunctionalComponent, h } from 'preact';
import styles from './styles.module.css';


interface Props {
    onChange: (value: string) => void,
    label?: string,
    value?: string,
}


const InputField: FunctionalComponent<Props> = ({ onChange, label = '', value = '' }) => {
    const onInputChange = (event: Event) => {
        if (event.target instanceof HTMLInputElement) {
            onChange(event.target.value);
        }
    };

    return (
        <label className={styles.root}>
            <div className={styles.label}>
                {label}:
            </div>
            <input
                type="text"
                value={value}
                className={styles.input}
                onChange={onInputChange}
            />
        </label>
    );
};

export default InputField;

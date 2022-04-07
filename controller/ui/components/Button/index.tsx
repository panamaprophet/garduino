import { FunctionalComponent, h } from 'preact';
import styles from './styles.module.css';


type ButtonColorTheme = 'default' | 'dark';

interface Props {
    onClick: () => void,
    label?: string,
    type?: ButtonColorTheme,
}


const Button: FunctionalComponent<Props> = ({ onClick, label = '', type = 'default' }) => {
    const classes = [
        styles.root,
        styles[`type_${type}`]
    ];

    return (
        <button className={classes.join(' ')} onClick={onClick}>
            {label}
        </button>
    );
};

export default Button;

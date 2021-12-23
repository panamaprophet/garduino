import {FunctionalComponent} from 'preact';
import * as styles from './styles.module.css';


type ButtonColorTheme = 'default' | 'dark';

interface Props {
    onClick: () => {},
    label?: string,
    type?: ButtonColorTheme,
};


const Button: FunctionalComponent<Props> = ({onClick, label = '', type = 'default'}) => {
    const classes = [
        styles.root, 
        styles[`type_${type}`],
    ];

    return (
        <button className={classes.join(' ')} onClick={onClick}>
            {label}
        </button>
    );
};

export default Button;
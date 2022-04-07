import { FunctionalComponent, h } from 'preact';


interface Props {
    name: string,
    value: any,
}


const SensorData: FunctionalComponent<Props> = ({ name, value }) => {
    if (!value) {
        return null;
    }

    return (
        <div>
            <span>{name}:</span>&nbsp;<span>{value}</span>
        </div>
    );
};

export default SensorData;

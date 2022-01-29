import _gm from 'gm';
import stream from 'stream';
import {format} from 'date-fns';
import {range, reduceItemsCountBy} from './index';

const gm = _gm.subClass({imageMagick: true});


type SvgChartLabelOptions = {
    x?: number,
    y?: number,
    isVertical?: boolean,
    textAttributes: string,
};

type SvgChartLineOptions = {
    colors: string[],
};

type SvgChartLegendOptions = {
    textAttributes: string,
    legendTopOffset: number,
    colors: string[],
};

type SvgChartData = {
    [key: string]: number[];
};

type SvgChartOptions = {
    width?: number,
    height?: number,
    colors?: string[],
    legendTopOffset?: number,
    maxLabelsCount?: number,
    textAttributes?: string,
};


const DEFAULT_CHART_OPTIONS = {
    width: 1000,
    height: 1000,
    legendTopOffset: 5,
    maxLabelsCount: 10,
    textAttributes: 'font-family="Helvetica, Arial, sans-serif" font-size="0.1em"',
    colors: ['#0dd900', '#0074d9', '#c200d9', '#d96400'],
};


/**
 * transforms array of numbers to string with coordinates based on percentage
 *
 * @returns {String} svg polyline points attribute value
 */
const valuesToPolylinePoints = (data: number[]): string => data.map((item, index) => `${index / (data.length / 100)},${100 - item}`).join(' ');

/**
 * @returns {string[]} svg
 */
const createSvgChartLines = (points: string[], {colors}: SvgChartLineOptions): string[] => points.map((p, index) => {
    const color = colors[index % colors.length];

    return `<polyline fill="none" stroke="${color}" points="${p}" />`;
});

/**
 * @returns {String} svg
 */
const createSvgChartLabels = (data: (number|string)[], options: SvgChartLabelOptions): string => {
    const labels = data.map((item, index) => {
        const x = options.x || (index / (data.length / 100));
        const y = options.y || (index / (data.length / 100));
        const rotation = options.isVertical ? `rotate(-90,${x},${y})` : '';
        const transformation = `transform="${rotation}"`;

        return `<text ${options.textAttributes} ${transformation} x="${x}" y="${y}">${item}</text>`;
    });

    return `<g>${labels.join('')}</g>`;
};

/**
 * @returns {String} svg
 */
const createSvgChartGrid = (ys: number[] = [], xs: number[] = []): string => {
    const yLines = ys.map((_, index) => {
        const value = index / (ys.length / 100);

        return `<line x1="0" y1="${value}" x2="100%" y2="${value}" stroke="#eee"></line>`;
    });

    const xLines = xs.map((_, index) => {
        const value = index / (xs.length / 100);

        return `<line x1="${value}" y1="0" x2="${value}" y2="100%" stroke="#eee"></line>`;
    });

    return `
        ${yLines.join('\n')}
        ${xLines.join('\n')}
        <line x1="0" y1="100%" x2="100%" y2="100%" stroke="#333"></line>
        <line x1="0" y1="100%" x2="0" y2="0" stroke="#333"></line>
    `;
};

/**
 * @returns {string[]} svg
 */
const createSvgChartLegend = (data: (number|string)[], {textAttributes, legendTopOffset, colors}: SvgChartLegendOptions): string[] => {
    return data.map((key, index) => {
        return `<text ${textAttributes} x="80" y="${index * legendTopOffset + legendTopOffset}" fill="${colors[index % colors.length]}">${key}</text>`;
    });
};

const formatDates = (dates: (number|Date)[]): string[] => dates.map(date => format(date, 'dd.MM.yy HH:mm'));

/**
 * @returns {String} svg
 */
export const createSvgChart = ({date, ...data}: SvgChartData, options: SvgChartOptions = {}): string => {
    const {
        width,
        height,
        colors,
        legendTopOffset,
        maxLabelsCount,
        textAttributes,
    } = {...DEFAULT_CHART_OPTIONS, ...options};

    const keys = Object.keys(data);
    const points = keys.map(key => valuesToPolylinePoints(data[key]));
    const lines = createSvgChartLines(points, {colors});

    const ys = reduceItemsCountBy(range(10, 100, 10).reverse(), maxLabelsCount);
    const xs = formatDates(reduceItemsCountBy(date, maxLabelsCount));

    const grid = createSvgChartGrid(ys);
    const yLabels = createSvgChartLabels(ys, {x: 5, textAttributes});
    const xLabels = createSvgChartLabels(xs, {y: 95, isVertical: true, textAttributes});
    const legend = createSvgChartLegend(keys, {legendTopOffset, textAttributes, colors});

    const chart = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${width}" height="${height}" viewBox="0 0 100 100" preserveAspectRatio="none">
            ${grid}
            ${lines.join('')}
            ${yLabels}
            ${xLabels}
            ${legend.join('')}
        </svg>`;

    return chart;
};

/**
 * renders svg markup to png
 *
 * @param {String} svg
 * @returns {Promise<stream.Readable>}
 */
export const svg2png = (svg: string): Promise<stream.Readable> => {
    return new Promise((resolve, reject) => {
        gm(Buffer.from(svg), 'image.svg').stream('png', (error: Error | null, result: stream.Readable) => error ? reject(error) : resolve(result));
    });
};
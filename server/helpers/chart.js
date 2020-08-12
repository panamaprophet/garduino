const sharp = require('sharp');
const {range, reduceItemsCountBy} = require('./index');


const COLOR_MAP = ['#0dd900', '#0074d9', '#c200d9', '#d96400'];
const MAX_LABELS_COUNT = 20;
const LEGEND_TOP_OFFSET = 5;
const TEXT_ATTRIBUTES = 'font-family="Helvetica, Arial, sans-serif" font-size="0.2em"';


const valuesToPolylinePoints = data => data.map((item, index) => `${index / (data.length / 100)},${100 - item}`).join(' ');

const createSvgChartLines = points => points.map((p, index) => {
    const color = COLOR_MAP[index % COLOR_MAP.length];

    return `<polyline fill="none" stroke="${color}" stroke-width="1" points="${p}" />`;
});

const createSvgChartLabels = (data, options = {}) => {
    const limitedItems = reduceItemsCountBy(data, MAX_LABELS_COUNT);

    const labels = limitedItems.map((item, index) => {
        const x = options.x || (index / (limitedItems.length / 100));
        const y = options.y || (index / (limitedItems.length / 100));
        const rotation = options.isVertical ? `rotate(-90,${x},${y})` : '';
        const transformation = `transform="${rotation}"`;

        return `<text ${TEXT_ATTRIBUTES} ${transformation} x="${x}" y="${y}">${item}</text>`;
    });

    return `<g>${labels.join('')}</g>`;
};

const createSvgChart = ({date, ...data}) => {
    const keys = Object.keys(data);
    const points = keys.map(key => valuesToPolylinePoints(data[key]));
    const lines = createSvgChartLines(points);
    const verticalLabels = createSvgChartLabels(range(10, 100, 10).reverse(), {x: 5});
    const horizontalLabels = createSvgChartLabels(date, {y: 95, isVertical: true});
    const legend = keys.map((key, index) =>
        `<text ${TEXT_ATTRIBUTES} x="80" y="${index * LEGEND_TOP_OFFSET + LEGEND_TOP_OFFSET}" fill="${COLOR_MAP[index % COLOR_MAP.length]}">${key}</text>`);

    const chart = `
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="chart">
            <line x1="0" y1="100%" x2="100%" y2="100%" stroke="#333" stroke-width="1"></line>
            <line x1="0" y1="100%" x2="0" y2="0" stroke="#333" stroke-width="1"></line>
            ${lines.join('')}
            ${verticalLabels}
            ${horizontalLabels}
            ${legend.join('')}
        </svg>
    `;

    return chart;
};

const svg2png = async (svg, options = {width: 600}) => {
    const sourceBuffer = Buffer.from(svg);
    const resultBuffer = await sharp(sourceBuffer, {density: 1000}).resize(options).png().toBuffer();

    return resultBuffer;
};


module.exports = {
    createSvgChart,
    svg2png,
}
const sharp = require('sharp');


const valuesToPolylinePoints = data => data.map((item, index) => `${index},${item}`).join(' ');

const createSvgChartLines = points => points.map(p => `<polyline fill="none" stroke="#0074d9" stroke-width="1" points="${p}" />`);

const createSvgChart = ({date, ...data}) => {
    const keys = Object.keys(data);
    const points = keys.map(key => valuesToPolylinePoints(data[key]));
    const lines = createSvgChartLines(points);
    const legend = '';

    const chart = `
        <svg viewBox="0 0 420 100" class="chart">
            <line x1="0" y1="100%" x2="100%" y2="100%" stroke="#333" stroke-width="1"></line>
            <line x1="0" y1="100%" x2="0" y2="0" stroke="#333" stroke-width="1"></line>
            ${lines.join('')}
            ${legend}
        </svg>
    `;

    return chart;
}

const svg2png = async svg => {
    const sourceBuffer = Buffer.from(svg);
    const resultBuffer = await sharp(sourceBuffer).png().toBuffer();

    return resultBuffer;
};


module.exports = {
    createSvgChart,
    svg2png,
}
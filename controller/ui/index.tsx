import { render, h } from 'preact';
import { Application } from './app';


const root = document.getElementById('root');

if (root) {
    render(<Application />, root);
}

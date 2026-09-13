import './styles/base.css';
import './styles/calendar.css';
import { route, start } from './lib/router';
import { homePage } from './pages/home';
import { calendarPage } from './calendar/editor';
import { printPage } from './calendar/print';

route('/', homePage);
route('/kalendar', calendarPage);
route('/kalendar/tisk', printPage);

start(document.getElementById('app')!);

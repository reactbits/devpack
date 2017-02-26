import _ from 'lodash';
import React from 'react';
import { render } from 'react-dom';

const styles = require('./demo.scss');

const greeting = _.filter(['Hello', 'World!'], _.identity).join(', ');
console.log(greeting);

render(<div className={styles.red}>{greeting}</div>, document.getElementById('root'));

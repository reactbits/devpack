import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';
import { render } from 'react-dom';
import { hover, hint } from 'css-effects';

const styles = require('./demo.scss');

const greeting = _.filter(['Hello', 'World!'], _.identity).join(', ');
console.log(greeting);

const className = classNames(styles.red, hover('grow'), hint());

render(<div className={className} data-hint="This is hint">{greeting}</div>, document.getElementById('root'));

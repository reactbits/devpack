import React from 'react';
import { render } from 'react-dom';

const styles = require('./demo.scss');

render(<div className={styles.red}>Hello!</div>, document.getElementById('root'));

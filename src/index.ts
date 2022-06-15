'use strict';

import { connect } from './database/mongodb/connect';
import { main } from './main';

connect().then(main);

/*
    This file is part of web3.js.

    web3.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    web3.js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/**
 * @file Type.js
 * @author Oscar Fonseca <hiro@cehh.io>
 * @date 2019
 */

import {cloneDeep} from 'lodash';

export default class Type {
    /**
     * @param {types} parameter
     *
     * @constructor
     */
    constructor(params, error /* from factory */, initParams /* from factory */) {

        /* Set the errors */
        this.error = error; 

        /* Initialize the parameters */
        this.params = cloneDeep(initParams); 
        
        /* Check for type and format validity */
        this.params.p = (/* condition check */)
                ? /* parameter standarization */
                : undefined;


        /* Check for default, auto, none, etc. key values */
        if (params.p === 'auto') this.params.p = /* default/auto/empty value */

        /* Throw if any parameter is still undefined */
        Object.keys(this.params).forEach((key) => {
            typeof this.params[key] === 'undefined' && this._throw(this.error[key]);
        });
    }

    _throw(message) {
        throw message;
    }
}

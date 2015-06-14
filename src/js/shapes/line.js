/*
// Copyright (C) 2015 University of Dundee & Open Microscopy Environment.
// All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* globals Raphael: false */
/* globals console: false */

var Line = function Line() {


};


var CreateLine = function CreateLine(options) {

	this.paper = options.paper;
	this.manager = options.manager;
};

CreateLine.prototype.startDrag = function startDrag(startX, startY) {

	console.log('CreateLine.startDrag', this, arguments);

	var color = this.manager.getColor();
	// Also need to get lineWidth and zoom/size etc.

	this.line = new Line();
};

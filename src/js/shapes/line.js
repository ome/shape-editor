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

var Line = function Line(options) {

    this.paper = options.paper;

    this._x1 = options.x1;
    this._y1 = options.y1;
    this._x2 = options.x2;
    this._y2 = options.y2;
    this._color = options.color;
    this._lineWidth = options.lineWidth || 2;

    this.element = this.paper.path();

    // TODO: setup drag handling etc.
    this.drawShape();
};


Line.prototype.setCoords = function setCoords(coords) {
    this._x1 = coords.x1 || this._x1;
    this._y1 = coords.y1 || this._y1;
    this._x2 = coords.x2 || this._x2;
    this._y2 = coords.y2 || this._y2;
    this.drawShape();
};


Line.prototype.getPath = function getPath() {
    return "M" + this._x1 + " " + this._y1 + "L" + this._x2 + " " + this._y2;
};


Line.prototype.drawShape = function drawShape() {

    var p = this.getPath(),
        color = this._color,
        lineW = this._lineWidth;

    this.element.attr({'path': p,
                       'stroke': '#' + color,
                       'fill': '#' + color,
                       'stroke-width': lineW});
};





var CreateLine = function CreateLine(options) {

    this.paper = options.paper;
    this.manager = options.manager;
    console.log("CreateLine", this.manager);
};

CreateLine.prototype.startDrag = function startDrag(startX, startY) {

    var color = this.manager.getColor();
    // Also need to get lineWidth and zoom/size etc.
    console.log("CreateLine", this.manager);
    console.log('CreateLine.startDrag', color, startX, startY);

    this.line = new Line({
        'paper': this.paper,
        'x1': startX,
        'y1': startY,
        'x2': startX,
        'y2': startY,
        'color': color});
};

CreateLine.prototype.drag = function drag(dragX, dragY) {

    this.line.setCoords({'x2': dragX, 'y2': dragY});
};

CreateLine.prototype.stopDrag = function stopDrag() {

    this.manager.addShape(this.line);
};

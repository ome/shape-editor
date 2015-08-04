
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
/* globals CreateRect: false */
/* globals Rect: false */
/* globals CreateLine: false */
/* globals Line: false */
/* globals CreateArrow: false */
/* globals Arrow: false */
/* globals CreateEllipse: false */
/* globals Ellipse: false */
/* globals console: false */

var ShapeManager = function ShapeManager(elementId, width, height, options) {

    var self = this;

    // Keep track of state, color etc
    this.STATES = ["SELECT", "RECT", "LINE", "ARROW", "ELLIPSE"];
    this._state = "SELECT";
    this._color = "ff0000";
    this._lineWidth = 2;
    this._orig_width = width;
    this._orig_height = height;
    this._zoom = 100;

    // Set up Raphael paper...
    this.paper = Raphael(elementId, width, height);

    // jQuery element used for .offset() etc.
    this.$el = $("#" + elementId);

    // Store all the shapes we create
    this._shapes = [];

    // Add a full-size background to cover existing shapes while
    // we're creating new shapes, to stop them being selected.
    // Mouse events on this will bubble up to svg and are handled below
    this.newShapeBg = this.paper.rect(0, 0, width, height);
    this.newShapeBg.attr({'fill':'#000',
                          'fill-opacity':0.01,
                          'cursor': 'crosshair'});
    this.newShapeBg.drag(
        function(){
            self.drag.apply(self, arguments);
        },
        function(){
            self.startDrag.apply(self, arguments);
        },
        function(){
            self.stopDrag.apply(self, arguments);
        });

    this.shapeFactories = {
        "RECT": new CreateRect({'manager': this, 'paper': this.paper}),
        "ELLIPSE": new CreateEllipse({'manager': this, 'paper': this.paper}),
        "LINE": new CreateLine({'manager': this, 'paper': this.paper}),
        "ARROW": new CreateArrow({'manager': this, 'paper': this.paper})
    };

    this.createShape = this.shapeFactories.LINE;
};

ShapeManager.prototype.startDrag = function startDrag(x, y, event){
    // clear any existing selected shapes
    this.clearSelected();

    // create a new shape with X and Y
    // createShape helper can get other details itself
    var offset = this.$el.offset(),
        startX = x - offset.left,
        startY = y - offset.top;

    // correct for zoom before passing coordinates to shape
    var zoomFraction = this._zoom / 100;
    startX = startX / zoomFraction;
    startY = startY / zoomFraction;
    this.createShape.startDrag(startX, startY);

    // Move this in front of new shape so that drag events don't get lost to the new shape
    this.newShapeBg.toFront();
};

ShapeManager.prototype.drag = function drag(dx, dy, x, y, event){
    var offset = this.$el.offset(),
        dragX = x - offset.left,
        dragY = y - offset.top;

    // correct for zoom before passing coordinates to shape
    var zoomFraction = this._zoom / 100;
    dragX = dragX / zoomFraction;
    dragY = dragY / zoomFraction;
    this.createShape.drag(dragX, dragY);
}; 

ShapeManager.prototype.stopDrag = function stopDrag(){
    this.createShape.stopDrag();
};

ShapeManager.prototype.setState = function setState(state) {
    if (this.STATES.indexOf(state) === -1) {
        console.log("Invalid state: ", state, "Needs to be in", this.STATES);
        return;
    }
    // When creating shapes, cover existing shapes with newShapeBg
    var shapes = ["RECT", "LINE", "ARROW", "ELLIPSE"];
    if (shapes.indexOf(state) > -1) {
        this.newShapeBg.show().toFront();
        // clear selected shapes
        this.clearSelected();

        if (this.shapeFactories[state]) {
            this.createShape = this.shapeFactories[state];
        }
    } else {
        this.newShapeBg.hide();
    }

    this._state = state;
};

ShapeManager.prototype.getState = function getState() {
    return this._state;
};

ShapeManager.prototype.setZoom = function setZoom(zoomPercent) {
    // var zoom = this.shapeEditor.get('zoom');

    // var $imgWrapper = $(".image_wrapper"),
    //     currWidth = $imgWrapper.width(),
    //     currHeight = $imgWrapper.height(),
    //     currTop = parseInt($imgWrapper.css('top'), 10),
    //     currLeft = parseInt($imgWrapper.css('left'), 10);

    // var width = 512 * zoom / 100,
    //     height = 512 * zoom / 100;
    // $("#shapeCanvas").css({'width': width + "px", 'height': height + "px"});

    this._zoom = zoomPercent;
    // Update the svg and our newShapeBg.
    // $("svg").css({'width': width + "px", 'height': height + "px"});
    var width = this._orig_width * zoomPercent / 100,
        height = this._orig_height * zoomPercent / 100;
    this.paper.setSize(width, height);
    this.paper.canvas.setAttribute("viewBox", "0 0 "+width+" "+height);
    this.newShapeBg.attr({'width': width, 'height': height});

    // zoom the shapes
    this._shapes.forEach(function(shape){
        shape.setZoom(zoomPercent);
    });

    // // image 
    // $(".image_wrapper").css({'width': width + "px", 'height': height + "px"});
    // // offset
    // var deltaTop = (height - currHeight) / 2,
    //     deltaLeft = (width - currWidth) / 2;
    // $(".image_wrapper").css({'left': (currLeft - deltaLeft) + "px",
    //                          'top': (currTop - deltaTop) + "px"});
};

ShapeManager.prototype.getZoom = function getZoom(zoomPercent) {
    return this._zoom;
};

ShapeManager.prototype.setColor = function setColor(color) {
    this._color = color;
    var selected = this.getSelected();
    for (var s=0; s<selected.length; s++) {
        selected[s].setColor(color);
    }
};

ShapeManager.prototype.getColor = function getColor() {
    return this._color;
};

ShapeManager.prototype.setLineWidth = function setLineWidth(lineWidth) {
    lineWidth = parseInt(lineWidth, 10);
    this._lineWidth = lineWidth;
    var selected = this.getSelected();
    for (var s=0; s<selected.length; s++) {
        selected[s].setLineWidth(lineWidth);
    }
};

ShapeManager.prototype.getLineWidth = function getLineWidth() {
    return this._lineWidth;
};

// Add a json shape object
ShapeManager.prototype.addShapeJson = function addShapeJson(jsonShape) {
    
    var s = jsonShape,
        newShape,
        color = s.color || this.getColor(),
        lineWidth = s.lineWidth || this.getLineWidth(),
        zoom = this.getZoom(),
        options = {'manager': this,
                   'paper': this.paper,
                   'lineWidth': lineWidth,
                   'zoom': zoom,
                   'color': color};

    if (s.type === 'Ellipse') {
        options.cx = s.cx;
        options.cy = s.cy;
        options.rx = s.rx;
        options.ry = s.ry;
        options.rotation = s.rotation || 0;
        newShape = new Ellipse(options);
    }
    else if (s.type === 'Rectangle') {
        options.x = s.x;
        options.y = s.y;
        options.width = s.width;
        options.height = s.height;
        newShape = new Rect(options);
    }
    else if (s.type === 'Line') {
        options.x1 = s.x1;
        options.y1 = s.y1;
        options.x2 = s.x2;
        options.y2 = s.y2;
        newShape = new Line(options);
    }
    else if (s.type === 'Arrow') {
        options.x1 = s.x1;
        options.y1 = s.y1;
        options.x2 = s.x2;
        options.y2 = s.y2;
        newShape = new Arrow(options);
    }

    this._shapes.push(newShape);
};

// Add a shape object
ShapeManager.prototype.addShape = function addShape(shape) {
    this._shapes.push(shape);
};

ShapeManager.prototype.getSelected = function getSelected() {
    var selected = [];
    for (var i=0; i<this._shapes.length; i++) {
        if (this._shapes[i].isSelected()) {
            selected.push(this._shapes[i]);
        }
    }
    return selected;
};

ShapeManager.prototype.deleteSelected = function getSelected() {
    var notSelected = [];
    this._shapes.forEach(function(s) {
        if (s.isSelected()) {
            s.destroy();
        } else {
            notSelected.push(s);
        }
    });
    this._shapes = notSelected;
    this.$el.trigger("change:selected");
};

ShapeManager.prototype.clearSelected = function clearSelected() {
    for (var i=0; i<this._shapes.length; i++) {
        this._shapes[i].setSelected(false);
    }
    this.$el.trigger("change:selected");
};

ShapeManager.prototype.selectShape = function selectShape(shape) {
    this.clearSelected();
    shape.setSelected(true);
    this._color = shape.getColor();
    this._lineWidth = shape.getLineWidth();
    this.$el.trigger("change:selected");
};

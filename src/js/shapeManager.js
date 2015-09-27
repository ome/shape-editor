
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
    options = options || {};

    // Keep track of state, strokeColor etc
    this.STATES = ["SELECT", "RECT", "LINE", "ARROW", "ELLIPSE"];
    this._state = "SELECT";
    this._strokeColor = "#ff0000";
    this._strokeWidth = 2;
    this._orig_width = width;
    this._orig_height = height;
    this._zoom = 100;
    // Don't allow editing of shapes - no drag/click events
    this.canEdit = !options.readOnly;

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
    this.selectRegion = this.paper.rect(0, 0, width, height);
    this.selectRegion.hide().attr({'stroke': '#ddd',
                                   'stroke-width': 1,
                                   'stroke-dasharray': '- '});
    if (this.canEdit) {
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
    } else {
        this.shapeFactories = {};
    }
};

ShapeManager.prototype.startDrag = function startDrag(x, y, event){
    // clear any existing selected shapes
    this.clearSelected();

    var offset = this.$el.offset(),
        startX = x - offset.left,
        startY = y - offset.top;

    if (this.getState() === "SELECT") {

        this._dragStart = {x: startX, y: startY};

        this.selectRegion.attr({'x': startX,
                                'y': startY,
                                'width': 0,
                                'height': 0});
        this.selectRegion.toFront().show();

    } else {
        // create a new shape with X and Y
        // createShape helper can get other details itself

        // correct for zoom before passing coordinates to shape
        var zoomFraction = this._zoom / 100;
        startX = startX / zoomFraction;
        startY = startY / zoomFraction;
        this.createShape.startDrag(startX, startY);
    }

    // Move this in front of new shape so that drag events don't get lost to the new shape
    this.newShapeBg.toFront();
};

ShapeManager.prototype.drag = function drag(dx, dy, x, y, event){
    var offset = this.$el.offset(),
        dragX = x - offset.left,
        dragY = y - offset.top;

    if (this.getState() === "SELECT") {

        dx = this._dragStart.x - dragX,
        dy = this._dragStart.y - dragY;

        this.selectRegion.attr({'x': Math.min(dragX, this._dragStart.x),
                                'y': Math.min(dragY, this._dragStart.y),
                                'width': Math.abs(dx),
                                'height': Math.abs(dy)});
    } else {

        // correct for zoom before passing coordinates to shape
        var zoomFraction = this._zoom / 100;
        dragX = dragX / zoomFraction;
        dragY = dragY / zoomFraction;
        this.createShape.drag(dragX, dragY);
    }
};

ShapeManager.prototype.stopDrag = function stopDrag(){
    if (this.getState() === "SELECT") {

        // need to get MODEL coords (correct for zoom)
        var region = this.selectRegion.attr(),
            f = this._zoom/100,
            x = region.x / f,
            y = region.y / f,
            width = region.width / f,
            height = region.height / f;
        this.selectShapesByRegion({x: x, y: y, width: width, height: height});

        // Hide region and move drag listening element to back again.
        this.selectRegion.hide();
        this.newShapeBg.toBack();
    } else {
        this.createShape.stopDrag();
    }
};

ShapeManager.prototype.setState = function setState(state) {
    if (this.STATES.indexOf(state) === -1) {
        console.log("Invalid state: ", state, "Needs to be in", this.STATES);
        return;
    }
    // When creating shapes, cover existing shapes with newShapeBg
    var shapes = ["RECT", "LINE", "ARROW", "ELLIPSE"];
    if (shapes.indexOf(state) > -1) {
        this.newShapeBg.toFront();
        // clear selected shapes
        this.clearSelected();

        if (this.shapeFactories[state]) {
            this.createShape = this.shapeFactories[state];
        }
    } else if (state === "SELECT") {
        // Used to handle drag-select events
        this.newShapeBg.toBack();
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

ShapeManager.prototype.setStrokeColor = function setStrokeColor(strokeColor) {
    this._strokeColor = strokeColor;
    var selected = this.getSelected();
    for (var s=0; s<selected.length; s++) {
        selected[s].setStrokeColor(strokeColor);
    }
};

ShapeManager.prototype.getStrokeColor = function getStrokeColor() {
    return this._strokeColor;
};

ShapeManager.prototype.setStrokeWidth = function setStrokeWidth(strokeWidth) {
    strokeWidth = parseInt(strokeWidth, 10);
    this._strokeWidth = strokeWidth;
    var selected = this.getSelected();
    for (var s=0; s<selected.length; s++) {
        selected[s].setStrokeWidth(strokeWidth);
    }
};

ShapeManager.prototype.getStrokeWidth = function getStrokeWidth() {
    return this._strokeWidth;
};

ShapeManager.prototype.getShapesJson = function getShapesJson() {
    var data = [];
    this.getShapes().forEach(function(s){
        data.push(s.toJson());
    });
    return data;
};

ShapeManager.prototype.setShapesJson = function setShapesJson(jsonShapes) {
    this.deleteAll();
    var self = this;
    jsonShapes.forEach(function(s){
        self.addShapeJson(s);
    });
};

ShapeManager.prototype.regionToPath = function regionToPath(region, zoom) {
    var f = zoom ? zoom/100: this._zoom/100,
        x = parseInt(region.x * f, 10),
        y = parseInt(region.y * f, 10),
        width = parseInt(region.width * f, 10),
        height = parseInt(region.height * f, 10);

    return [["M" + x + "," + y],
                ["L" + (x + width) + "," + y],
                ["L" + (x + width) + "," + (y + height)],
                ["L" + x + "," + (y + height) + "Z"]
            ].join(",");
};

ShapeManager.prototype.findShapeAtCoords = function findShapeAtCoords(jsonShape) {

    var thisShapes = this.getShapes();
    for (var i=0; i<thisShapes.length; i++){
        if (thisShapes[i].compareCoords(jsonShape)) {
            return thisShapes[i];
        }
    }
    return false;
};

// Add new shapes from json but, IF it matches existing shape - offset a bit
ShapeManager.prototype.pasteShapesJson = function pasteShapesJson(jsonShapes, constrainRegion) {
    var self = this,
        allPasted = true;
    // For each shape we want to paste...
    jsonShapes.forEach(function(s){
        // check if a shape is at the same coordinates...
        var match = self.findShapeAtCoords(s);
        // if so, keep offsetting until we find a spot...
        while(match) {
            s = $.extend({}, s);
            s = match.offsetCoords(s, 20, 10);
            match = self.findShapeAtCoords(s);
        }
        // Create shape and test if it's in the specified region
        var newShape = self.createShapeJson(s);

        if (constrainRegion) {
            if (typeof constrainRegion === "boolean") {
                constrainRegion = {x:0, y:0, width:self._orig_width, height:self._orig_height};
            }
            if (!newShape.intersectRegion(constrainRegion)) {
                newShape.destroy();
                allPasted = false;
                return;
            }
        }
        self._shapes.push(newShape);
    });
    return allPasted;
};

ShapeManager.prototype.addShapesJson = function addShapesJson(jsonShapes) {
    var self = this;
    jsonShapes.forEach(function(s){
        self.addShapeJson(s);
    });
};

// Create and add a json shape object
ShapeManager.prototype.addShapeJson = function addShapeJson(jsonShape) {
    var newShape = this.createShapeJson(jsonShape);
    this._shapes.push(newShape);
    return newShape;
};

// Create a Shape object from json
ShapeManager.prototype.createShapeJson = function createShapeJson(jsonShape) {
    var s = jsonShape,
        newShape,
        strokeColor = s.strokeColor || this.getStrokeColor(),
        strokeWidth = s.strokeWidth || this.getStrokeWidth(),
        zoom = this.getZoom(),
        options = {'manager': this,
                   'paper': this.paper,
                   'strokeWidth': strokeWidth,
                   'zoom': zoom,
                   'strokeColor': strokeColor};
    if (jsonShape.id) {
        options.id = jsonShape.id;
    }

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
    return newShape;
};

// Add a shape object
ShapeManager.prototype.addShape = function addShape(shape) {
    this._shapes.push(shape);
    this.$el.trigger("new:shape", [shape]);
};

ShapeManager.prototype.getShapes = function getShapes() {
    return this._shapes;
};

ShapeManager.prototype.getShape = function getShape(shapeId) {
    var shapes = this.getShapes();
    for (var i=0; i<shapes.length; i++) {
        if (shapes[i]._id === shapeId) {
            return shapes[i];
        }
    }
};

ShapeManager.prototype.getSelected = function getSelected() {
    var selected = [],
        shapes = this.getShapes();
    for (var i=0; i<shapes.length; i++) {
        if (shapes[i].isSelected()) {
            selected.push(shapes[i]);
        }
    }
    return selected;
};

ShapeManager.prototype.getSelectedShapesJson = function getShapesJson() {
    var data = [];
    this.getShapes().forEach(function(s){
        if (s.isSelected()) {
            data.push(s.toJson());
        }
    });
    return data;
};

ShapeManager.prototype.deleteAll = function deleteAll() {
    this.getShapes().forEach(function(s) {
        s.destroy();
    });
    this._shapes = [];
    this.$el.trigger("change:selected");
};

ShapeManager.prototype.deleteSelected = function getSelected() {
    var notSelected = [];
    this.getShapes().forEach(function(s) {
        if (s.isSelected()) {
            s.destroy();
        } else {
            notSelected.push(s);
        }
    });
    this._shapes = notSelected;
    this.$el.trigger("change:selected");
};

ShapeManager.prototype.clearSelected = function clearSelected(silent) {
    for (var i=0; i<this._shapes.length; i++) {
        this._shapes[i].setSelected(false);
    }
    if (!silent) {
        this.$el.trigger("change:selected");
    }
};


ShapeManager.prototype.selectShapesByRegion = function selectShapesByRegion(region) {

    // Clear selected with silent:true, since we notify again below
    this.clearSelected(true);

    var toSelect = [];
    this.getShapes().forEach(function(shape){
        if (shape.intersectRegion(region)) {
            toSelect.push(shape);
        }
    });
    this.selectShapes(toSelect);
};


ShapeManager.prototype.selectAll = function selectAll(region) {
    this.selectShapes(this.getShapes());
};

// select shapes: 'shape' can be shape object or ID
ShapeManager.prototype.selectShapes = function selectShapes(shapes) {

    var strokeColor,
        strokeWidth;

    // Clear selected with silent:true, since we notify again below
    this.clearSelected(true);

    // Each shape, set selected and get color & stroke width...
    shapes.forEach(function(shape, i){
        if (typeof shape === "number") {
            shape = this.getShape(shape);
        }
        if (shape) {
            // for first shape, pick color
            if (strokeColor === undefined) {
                strokeColor = shape.getStrokeColor();
            } else {
                // for subsequent shapes, if colors don't match - set false
                if (strokeColor !== shape.getStrokeColor()) {
                    strokeColor = false;
                }
            }
            // for first shape, pick strokeWidth
            if (strokeWidth === undefined) {
                strokeWidth = shape.getStrokeWidth();
            } else {
                // for subsequent shapes, if colors don't match - set false
                if (strokeWidth !== shape.getStrokeWidth()) {
                    strokeWidth = false;
                }
            }
            shape.setSelected(true);
        }
    });
    if (strokeColor) {
        this._strokeColor = strokeColor;
    } else {
        this._strokeColor = undefined;
    }
    if (strokeWidth) {
        this._strokeWidth = strokeWidth;
    } else {
        this._strokeWidth = undefined;
    }
    this.$el.trigger("change:selected");
};

ShapeManager.prototype.notifyShapeChanged = function notifyShapeChanged(shape) {
    this.$el.trigger("change:shape", [shape]);
};

ShapeManager.prototype.getRandomId = function getRandomId() {
    // returns a random integer we can use for id
    // NB - we use negative numbers to distinguish from server-side IDs
    var rndString = Math.random() + "";     // E.g. 0.7158358106389642
    return -parseInt(rndString.slice(2), 10);    // -7158358106389642
};

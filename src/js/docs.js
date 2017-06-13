/* globals ShapeManager: false */
/* globals console: false */

$(function() {

    var WIDTH = 512,
        HEIGHT = 512;

    var options = {};

    var shapesClipboard = [];

    // We can choose to display shapes only - No editing
    // options = {'readOnly': true};

    var shapeManager = new ShapeManager("shapesCanvas",
                                        WIDTH, HEIGHT,
                                        options);

    var zoomPercent = 100;

    // set state depending on what we want to do,
    // for example to create Rectangle

    $("input[name='state']").click(function(){
        var state = $(this).val();
        shapeManager.setState(state);
    });

    $("input[name='strokeColor']").click(function(){
        var strokeColor = $(this).val();
        shapeManager.setStrokeColor(strokeColor);
    });

    $("select[name='strokeWidth']").change(function(){
        var strokeWidth = $(this).val();
        shapeManager.setStrokeWidth(strokeWidth);
    });

    var updateZoom = function updateZoom() {
        $("#zoomDisplay").text(zoomPercent + " %");
        shapeManager.setZoom(zoomPercent);
        var w = WIDTH * zoomPercent / 100,
            h = HEIGHT * zoomPercent / 100;
        $(".imageWrapper img").css({'width': w, 'height': h});
    };

    $("button[name='zoomIn']").click(function(){
        zoomPercent += 20;
        updateZoom();
    });
    $("button[name='zoomOut']").click(function(){
        zoomPercent -= 20;
        updateZoom();
    });

    $("button[name='deleteSelected']").click(function(){
        shapeManager.deleteSelectedShapes();
    });

    $("button[name='deleteAll']").click(function(){
        shapeManager.deleteAllShapes();
    });

    $("button[name='selectAll']").click(function(){
        shapeManager.selectAllShapes();
    });

    $("button[name='copyShapes']").click(function(){
        shapesClipboard = shapeManager.getSelectedShapesJson();
    });

    $("button[name='pasteShapes']").click(function(){
        // paste shapes, constraining to the image coords
        var p = shapeManager.pasteShapesJson(shapesClipboard, true);
        if (!p) {
            console.log("Shape could not be pasted: outside view port");
        }
    });

    $("button[name='getShapes']").click(function(){
      var json = shapeManager.getShapesJson();
      console.log(json);
    });

    $("button[name='getBBoxes']").click(function(){
      var shapes = shapeManager.getShapesJson();
      shapes.forEach(function(shape){
        var bbox = shapeManager.getShapeBoundingBox(shape.id);
        // Add each bbox as a Rectangle to image
        bbox.type = "Rectangle";
        bbox.strokeColor = "#ffffff";
        shapeManager.addShapeJson(bbox);
      });
    });

    $("button[name='selectShape']").click(function(){
      shapeManager.selectShapesById(1234);
    });

    var lastShapeId;
    $("button[name='deleteShapesByIds']").click(function(){
      shapeManager.deleteShapesByIds([lastShapeId]);
    });

    $("button[name='setShapes']").click(function(){
        var shapesJson = [
          {"type": "Rectangle",
            "strokeColor": "#ff00ff",
            "strokeWidth": 10,
            "x": 100, "y": 250,
            "width": 325, "height": 250},
          {"type": "Ellipse",
            "x": 300, "y": 250,
            "radiusX": 125, "radiusY": 250,
            "rotation": 100}
          ];
        shapeManager.setShapesJson(shapesJson);
    });

    $("#shapesCanvas").bind("change:selected", function(){
        var strokeColor = shapeManager.getStrokeColor();
        if (strokeColor) {
          $("input[value='" + strokeColor + "']").prop('checked', 'checked');
        } else {
           $("input[name='strokeColor']").removeProp('checked');
        }
        var strokeWidth = shapeManager.getStrokeWidth() || 1;
        $("select[name='strokeWidth']").val(strokeWidth);
    });

    $("#shapesCanvas").bind("change:shape", function(event, shapes){
        console.log("changed", shapes);
    });

    $("#shapesCanvas").bind("new:shape", function(event, shape){
        console.log("new", shape.toJson());
        console.log("selected", shapeManager.getSelectedShapesJson());
    });

    // Add some shapes to display
    shapeManager.addShapeJson({"id": 1234,
                               "type": "Rectangle",
                               "strokeColor": "#ff00ff",
                               "strokeWidth": 6,
                               "x": 200, "y": 150,
                               "width": 125, "height": 150});

    shapeManager.addShapeJson({"type": "Ellipse",
                               "x": 200, "y": 150,
                               "radiusX": 125, "radiusY": 50,
                               "rotation": 45});

    shapeManager.addShapeJson({"type": "Ellipse",
                               "strokeColor": "#ffffff",
                               "x": 204, "y": 260,
                               "radiusX": 95, "radiusY": 55,
                               "transform": "matrix(0.82 0.56 -0.56 0.82 183.0 -69.7)"});

    shapeManager.addShapeJson({"type": "Arrow",
                               "strokeColor": "#ffff00",
                               "strokeWidth": 4,
                               "x1": 25, "y1": 450,
                               "x2": 200, "y2": 400});

    shapeManager.addShapeJson({"type": "Arrow",
                               "strokeColor": "#ffff00",
                               "strokeWidth": 10,
                               "x1": 25, "y1": 250,
                               "x2": 200, "y2": 200});

    shapeManager.addShapeJson({"type": "Ellipse",
                              "strokeColor": "#00ff00",
                              "radiusY": 31.5,
                              "radiusX": 91,
                              "transform": "matrix(2.39437435854 -0.644012141633 2.14261951162 0.765696311828 -1006.17788921 153.860479773)",
                              "strokeWidth": 2,
                              "y": 297.5,
                              "x": 258});

    shapeManager.addShapeJson({"type": "Ellipse",
                          "strokeColor": "#ffff00",
                          "radiusY": 71.5,
                          "radiusX": 41,
                          "transform": "matrix(0.839800601976 0.542894970432 -0.542894970432 0.839800601976 111.894472287 -140.195845758)",
                          "strokeWidth": 2,
                          "y": 260.5,
                          "x": 419});

    var s = shapeManager.addShapeJson({"type": "Line",
                               "strokeColor": "#00ff00",
                               "strokeWidth": 2,
                               "x1": 400, "y1": 400,
                               "x2": 250, "y2": 310});
    lastShapeId = s.toJson().id;

    // We start off in the 'SELECT' mode
    shapeManager.setState("SELECT");
});

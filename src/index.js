import 'vtk.js/Sources/favicon';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyDataReader          from 'vtk.js/Sources/IO/Legacy/PolyDataReader';
import XMLReader          		  from 'vtk.js/Sources/IO/XML/XMLReader';
import vtkXMLPolyDataReader       from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkColorMaps               from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';

// For styling slider/dropdown
import controlPanel               from './controller.html'; 

// const fileName = 'heart.vtk'; // 'uh60.vtk'; // 'luggaBody.vtk';
const __BASE_PATH__ = 'localhost:8080';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const resetCamera = renderer.resetCamera;
const render = renderWindow.render;

fullScreenRenderer.addController(controlPanel);
const representationSelector = document.querySelector('.representations');
const voltageSolutionSlider = document.querySelector('.vSolns');
const datasetSelector = document.querySelector('.datasets');
const displayEdgeSelector = document.querySelector('.visibility');

var initialModelResult = '/data/DS_1/Vsoln_testrun_' + voltageSolutionSlider.value + '.vtp'; 
var baseModelResult = '/data/DS_1/Vsoln_testrun_';
var actor = '';
const reader = vtkXMLPolyDataReader.newInstance();
var fileLocation = initialModelResult;


// -----------------------------------------------------------
// Looking at grabbing the information from the NeCTAR container site
// instead of locally, but haven't figured it out for the moment;
// focusing on running Continuity from within docker <22/1/2018>
// ----------------------------------------------------------- 
// 
// const fileLocTest = 'DS_1/Vsoln_testrun_' + voltageSolutionSlider.value + '.vtp';
// const fileTest = 'https://swift.rc.nectar.org.au:8888/v1/AUTH_53ca8bcbf7fd4140b05648b13b7b7898/CardiacContainerTest/';
// var initialModelResult = fileTest + fileLocTest;
// var fileLocation =  initialModelResult;

// fetch(fileLocation, {headers: {'Access-Control-Allow-Origin': '*'}}).then(function(response) { //{mode: 'no-cors'}
//   console.log("RESPONSE");
//   // response.blob().then(function(m) {
//   //   var x = URL.createObjectURL(m);
//   //   console.log(x);
//   // });
// });

// var express = require('express');
// var app = express();
// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });
// -----------------------------------------------------------


// -----------------------------------------------------------
// Initially display the mesh (pre cardiac simulation) and setup
// the different heart models that can be loaded
// -----------------------------------------------------------  
setupDummyFiles();
initialiseDisplayedMesh();


function initialiseDisplayedMesh() {
  reader.setUrl(fileLocation).then(() => {
    reader.update();
    const polydata = reader.getOutputData();
    
    // -----------------------------------------------------------
    // Create the colour mapping for the rendered heart mesh,
    // taken and modified from the SaveMeshAndScalarValues.py script
    // -----------------------------------------------------------
    // Applying a preset instead.
    // const presetName = 'Cool to Warm';  
    // const preset = vtkColorMaps.getPresetByName(presetName);
    // colourTransferFnc.applyColorMap(preset);
    const colourTransferFnc = vtkColorTransferFunction.newInstance();
    colourTransferFnc.addRGBPoint(0.0, 0.23137254902000001, 0.298039215686, 0.75294117647100001);
    colourTransferFnc.addRGBPoint(1.0, 0.70588235294099999, 0.015686274509800001, 0.149019607843);

    const mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: false,
      scalarVisibility: true // Whether scalar data is displayed
    });

    mapper.setInputData(polydata);
    mapper.setLookupTable(colourTransferFnc);
    
    // Setup actor & add mapper 
    actor = vtkActor.newInstance();
    actor.setMapper(mapper);

    // Make sure wireframe is displayed correctly
    const test = document.getElementsByClassName('visibility')[0];
    if(test.checked && (actor.getProperty().getEdgeVisibility() !== true)) {
      actor.getProperty().setEdgeVisibility(true);
    }

    renderer.addActor(actor);
    resetCamera();
    render();
  });
}

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

// Show/Hide the visiblity of the surface mesh's edges
displayEdgeSelector.addEventListener('change', (e) => {
  actor.getProperty().setEdgeVisibility(!!e.target.checked);
  renderWindow.render();
});

// Modify how the displayed mesh looks (i.e. surface/points)
representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  actor.getProperty().setPointSize(4); // Set point size to 4
  renderWindow.render();
});

// Select different datasets to load from a drop down
datasetSelector.addEventListener('change', (e) => {
  const fileNumber = 'Loading Dataset #' + e.target.value;
  console.log(fileNumber);

  fileLocation = '/data/DS_' + e.target.value + '/Vsoln_testrun_' + voltageSolutionSlider.value + '.vtp';
  baseModelResult = '/data/DS_' + e.target.value + '/Vsoln_testrun_';
  
  actor.delete();
  initialiseDisplayedMesh(fileLocation);

  renderWindow.render();
});

// Update the displayed scalar values
voltageSolutionSlider.addEventListener('input', (e) => {
  const newFileLocation = baseModelResult + e.target.value + '.vtp';

  
  // Simulation model file results
  updateScalarData(newFileLocation);
});

/**
 * Currently sets up a dummy example of a drop down list of files.
 * TODO: load these as they are "established/created/found"
 */
function setupDummyFiles() {
  var datasetsElement = document.getElementsByClassName('datasets')[0];
  var file = '';

  for (var i = 1; i <= 12; i++) {
    file = document.createElement('option');
    file.text = 'Dataset #' + i; // Label
    file.value = i; // value of the option.
    datasetSelector.appendChild(file);
  }
}

/**
 * Extracts the scalar data from the data of the saved voltage solutions and 
 * uses the new data to update the existing scalar information.
 * 
 * @param  {String} newFileLocation 
 *         The location of the file that corresponds to the slider value.
 */
function updateScalarData(newFileLocation) {
  reader.setUrl(newFileLocation).then(() => {
    reader.update();
    var scalarData = reader.getOutputData().get().pointData.getScalars();
    
    // Pre-simulation model file results
    if (newFileLocation === initialModelResult) {
      scalarData = '';
    }

    actor.getMapper().getInputData().getPointData().setScalars(scalarData);
    actor.modified();
    renderWindow.render();
  });
}

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------
global.reader = reader;
global.fullScreenRenderer = fullScreenRenderer;
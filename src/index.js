import 'vtk.js/Sources/favicon';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyDataReader          from 'vtk.js/Sources/IO/Legacy/PolyDataReader';
import XMLReader          		    from 'vtk.js/Sources/IO/XML/XMLReader';
import vtkXMLPolyDataReader       from 'vtk.js/Sources/IO/XML/XMLPolyDataReader';
import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkColorMaps               from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
// import swiftClient                from 'openstack-swift-client';

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

/* FILES THAT ARE LOCATED LOCALLY */
// var initialModelResult = '/data/DS_1/Vsoln_testrun_' + voltageSolutionSlider.value + '.vtp'; 
// var baseModelResult = '/data/DS_1/Vsoln_testrun_';
// var fileLocation = initialModelResult;

var actor = '';
const reader = vtkXMLPolyDataReader.newInstance();

//-------
// stuff
//-------
// const url = 'https://keystone.rc.nectar.org.au:5000/v3/';
// const uname = 's4313512@student.uq.edu.au';
// const pwd = 'ZDU4NTQwNWE4ZDU4M2I4';
// let client = new swiftClient(url, uname, pwd);
// console.log('client: '+ client);
// let container = client.container('CardiacContainerTest');
// console.log('container: ' + container);
// // container.list().then((stuff) => {
// //     console.log("Done!: " + stuff);
// // });

// -----------------------------------------------------------
// Files located on Nectar, current hack found <2/2/18>:
// Run Safari with security disabled:
// <Toolbar> Develop -> Disable Cross-Origin Restrictions
// ----------------------------------------------------------- 
var baseModelResult = 'DS_1/Vsoln_testrun_';
var middleObjStoreURL = baseModelResult + voltageSolutionSlider.value + '.vtp';
const baseObjStoreURL = 'https://swift.rc.nectar.org.au:8888/v1/AUTH_53ca8bcbf7fd4140b05648b13b7b7898/CardiacContainerTest/';
const initialModelResult = baseObjStoreURL + middleObjStoreURL;
var fileLocation =  initialModelResult;

// -----------------------------------------------------------
// Initially display the mesh (pre cardiac simulation) and setup
// the different heart models that can be loaded
// -----------------------------------------------------------  
// Keep augmenting dataset names until an invalid one is reached 
// (5/2/18, atm 6 DS loaded, 7 is invalid)
// Modified from answer: https://stackoverflow.com/questions/45008330/how-can-i-use-fetch-in-while-loop
// && https://developers.google.com/web/updates/2015/03/introduction-to-fetch
const urlTest = baseObjStoreURL + 'DS_';
var i = 1;
var u = urlTest + i + '/';

// Check for valid links of uploaded files here
// NOTE: doesn't check if the file is correct, just that the link works.
var fetchUploadedDatasets = function(url) {
  fetch(url).then(function(response) {
    if(response.status !== 404) { // Not equal to incorrect status
      i = i + 1;
      url = urlTest + i + '/';
      fetchUploadedDatasets(url); 
    }
    else {
      setupDummyFiles(i); //Display a dropdown of so-far uploaded datasets
      return;
    }
  });
}

fetchUploadedDatasets(u); 
initialiseDisplayedMesh(fileLocation);

/**
 * Assign a colour map and render everything properly.
 */
function initialiseDisplayedMesh(file) {
  reader.setUrl(file).then(() => {
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

  /* Locally Located Files */
  // fileLocation = '/data/DS_' + e.target.value + '/Vsoln_testrun_' + voltageSolutionSlider.value + '.vtp';
  // baseModelResult = '/data/DS_' + e.target.value + '/Vsoln_testrun_';

  /* Files Located On Object Store */
  baseModelResult = 'DS_' + e.target.value + '/Vsoln_testrun_';
  middleObjStoreURL = baseModelResult + voltageSolutionSlider.value + '.vtp';
  fileLocation =  baseObjStoreURL + middleObjStoreURL;
  
  actor.delete();
  initialiseDisplayedMesh(fileLocation);

  renderWindow.render();
});

// Update the displayed scalar values
voltageSolutionSlider.addEventListener('input', (e) => {
  fileLocation = baseObjStoreURL + baseModelResult + e.target.value + '.vtp'; // new file location
  console.log("Scalar Value from: " +  fileLocation);
  
  // Simulation model file results
  updateScalarData(fileLocation); /* Added baseObjStoreURL because loaded from website*/
});

/**
 * Currently sets up a dummy example of a drop down list of files.
 * TODO: load these as they are "established/created/found"
 */
//ADDED MAXVALIDLINKS INSTAGE OF >= 12 and cleared datasetSelector
function setupDummyFiles(maxValidLinks) {
  var datasetsElement = document.getElementsByClassName('datasets')[0];
  var file = '';

  for (var i = 1; i < maxValidLinks; i++) { //maxValidLinks = 6 at this stage
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